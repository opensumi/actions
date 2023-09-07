import { generateCodeReview } from './openai/generate-code-review';
import { call } from './core';

const keyword = 'Code Review:';

call(async ({ github, context, core }) => {
  let skip = false;
  if (context.ref && context.ref.includes('backport/queue')) {
    skip = true;
  }
  if (skip) {
    return;
  }

  const { data: diff } = await github.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.issue.number,
    mediaType: {
      format: 'diff',
    },
  });

  const title = context.payload.pull_request?.title;
  const body = context.payload.pull_request?.body;
  try {
    const msg = await generateCodeReview(
      title,
      body,
      diff as unknown as string
    );
    const comments = await github.rest.issues.listComments({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    // find comments which include 'Code Review'
    const chatGPTComment = comments.data.find((comment) =>
      comment.body.includes(keyword)
    );
    if (chatGPTComment) {
      await github.rest.issues.updateComment({
        comment_id: chatGPTComment.id,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `${keyword}\n\n${msg}`,
      });
    } else {
      await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `${keyword}\n\n${msg}`,
      });
    }
  } catch (error) {
    console.error('Generate code review failed: ', error);
    core.setOutput('error', error);
  }
});
