import { generateCodeReview } from './openai/generateCodeReview';
import { Octokit } from '@octokit/rest';
import { call } from './core';

const keyword = 'ChatGPT Code Review:';

call(async ({ github, context, core }) => {
  const token = core.getInput('github-token', { required: true });
  const octo = new Octokit({
    auth: token,
  });
  // 不知道为什么，@actions/github 自带的那个 octo 请求不到 patch 文件，这里使用单独的包进行请求
  const { data: patch } = await octo.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.issue.number,
    mediaType: {
      format: 'patch',
    },
  });

  const title = context.payload.pull_request?.title;
  const msg = await generateCodeReview(title, patch as unknown as string);
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
