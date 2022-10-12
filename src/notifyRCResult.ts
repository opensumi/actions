import { call } from './core';

call(async ({ github, context, core }) => {
  await github.rest.repos.createCommitComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    body:
      `<!-- versionInfo: RC | ${process.env.CURRENT_VERSION} -->\n` +
      `Release Candidate Summary:\n\n${process.env.SUMMARY}`,
    commit_sha: process.env.CURRENT_COMMIT,
  });
});
