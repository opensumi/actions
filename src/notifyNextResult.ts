import { call } from './core';
import { createVersionText } from './helpers';

call(async ({ github, context }) => {
  const commentBody = createVersionText('Next', process.env.CURRENT_VERSION!);

  await github.rest.repos.createCommitComment({
    owner: 'opensumi',
    repo: 'core',
    body: commentBody,
    commit_sha: process.env.CURRENT_COMMIT,
  });
});
