import { generateCommitMessage } from './openai/generate-commit-message';
import { Octokit } from '@octokit/rest';
import { call } from './core';

const keyword = 'ChatGPT Code Review:';

call(async ({ github, context, core }) => {
  const token = core.getInput('github-token', { required: true });
  const octo = new Octokit({
    auth: token,
  });
  // 不知道为什么，@actions/github 自带的那个 octo 请求不到 patch 类型
  const { data: diff } = await octo.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.issue.number,
    mediaType: {
      format: 'diff',
    },
  });

  console.log(`🚀 ~ file: codeReview.ts:14 ~ call ~ diff:`, diff);
  console.log(typeof diff);

  const msg = await generateCommitMessage(diff as unknown as string);
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
});
