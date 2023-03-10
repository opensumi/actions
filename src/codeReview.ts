import { generateCommitMessage } from './openai/generate-commit-message';

import { call } from './core';

call(async ({ github, context }) => {
  const { data: diff } = await github.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.issue.number,
    mediaType: {
      format: 'diff',
    },
  });
  const msg = await generateCommitMessage(diff as unknown as string);
  await github.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: `ChatGPT Code Review:\n${msg}`,
  });
});
