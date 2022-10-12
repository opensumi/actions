import { call } from './core';
import { readSummary } from './helpers';

call(async ({ github, context, core }) => {
  let body = `Release Candidate Summary:\n`;
  try {
    const summary = await readSummary();
    body += summary;
  } catch (error) {
    console.log(`🚀 ~ file: notifyRCResult.ts ~ line 10 ~ call ~ error`, error);
  }

  await github.rest.repos.createCommitComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    body,
    commit_sha: process.env.CURRENT_COMMIT,
  });
});
