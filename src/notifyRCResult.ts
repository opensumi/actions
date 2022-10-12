import { call } from './core';

call(async ({ github, context, core }) => {
  await github.rest.repos.createCommitComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: `Release Candidate Summary:\n${process.env.SUMMARY}`,
    commit_sha: process.env.CURRENT_COMMIT,
  });
});
