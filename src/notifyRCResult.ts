import { call } from './core';

call(async ({ github, context, core }) => {
  await github.rest.repos.createCommitComment({
    owner: 'opensumi',
    repo: 'core',
    body: `Summary:\n${process.env.GITHUB_STEP_SUMMARY}`,
    commit_sha: process.env.CURRENT_COMMIT,
  });
});
