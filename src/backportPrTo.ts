import { call } from './core';
import { execAsync } from './utils/exec';

call(async ({ github, context, core }) => {
  const owner = process.env.OWNER;
  const repo = process.env.REPO;
  const pullNumber = process.env.PULL_NUMBER;
  const { data } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: parseInt(pullNumber),
  });
  const { sha } = data.base;

  core.setOutput('sha', sha);
  core.setOutput('title', data.title);
  core.setOutput('body', data.body);
  if (process.env.PR_FROM && process.env.TARGET_BRANCH) {
    await github.rest.pulls.create({
      owner,
      repo,
      title: data.title,
      body: `${data.body}\n\nBackport from #${pullNumber} ${sha}`,
      head: process.env.PR_FROM,
      base: process.env.TARGET_BRANCH,
    });
  }
});
