import { call } from './core';

call(async ({ github, context, core }) => {
  await github.rest.repos.createCommitComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: process.env.GITHUB_STEP_SUMMARY,
    commit_sha: process.env.CURRENT_COMMIT,
  });
});
