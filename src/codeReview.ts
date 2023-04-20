import { generateCodeReview } from './openai/generateCodeReview';
import { Octokit } from '@octokit/rest';
import { call, getGitHubToken } from './core';

const keyword = 'ChatGPT Code Review:';

call(async ({ github, context, core }) => {
  let skip = false;
  if (context.ref && context.ref.includes('backport/queue')) {
    skip = true;
  }
  if (skip) {
    return;
  }

  const token = getGitHubToken();

  // 不知道为什么，@actions/github 自带的那个 octo 请求不到 diff 文件，这里使用单独的包进行请求
  const octo = new Octokit({
    auth: token,
  });

  const { data: diff } = await octo.pulls.get({
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
    const msg = await generateCodeReview(title, body, diff as unknown as string);
    const comments = await github.rest.issues.listComments({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    // find comments which include 'ChatGPT Code Review'
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
