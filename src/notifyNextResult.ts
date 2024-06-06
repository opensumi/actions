import { call } from './core';
import { createVersionText } from './helpers';
import { getRepo } from './utils/context';

call(async ({ github, context }) => {
  const commentBody = createVersionText('Next', process.env.CURRENT_VERSION!);

  const repo = getRepo(context);

  await github.rest.repos.createCommitComment({
    ...repo,
    body: commentBody,
    commit_sha: process.env.CURRENT_COMMIT,
  });
});
