import { call } from './core';

call(async ({ github, context, core }) => {
  const owner = process.env.OWNER;
  const repo = process.env.REPO;
  const pullNumber = process.env.PULL_NUMBER;
  const { data } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: parseInt(pullNumber),
  });
  const { sha } = data.head;

  core.setOutput('sha', sha);
  core.setOutput('title', data.title);
  core.setOutput('body', data.body);
  if (process.env.PR_FROM && process.env.TARGET_BRANCH) {
    const pull = await github.rest.pulls.create({
      owner,
      repo,
      title: data.title,
      body: `${data.body}\n\n---\n\nBackport from #${pullNumber} ${sha.slice(
        0,
        10
      )}\n\nThanks to @${data.user.login} for your valuable contribution.`,
      head: process.env.PR_FROM,
      base: process.env.TARGET_BRANCH,
    });
    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pull.data.number,
      labels: ['🚧 backport'],
    });
  }
});
