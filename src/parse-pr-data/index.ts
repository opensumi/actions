import { call } from '../core';

call(async ({ github, context, core, meta }) => {
  const owner = core.getInput('owner');
  const repo = core.getInput('repo');
  const pullNumber = parseInt(core.getInput('pull_number'));

  const { data } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  // base <- head
  const headSha = data.head.sha;
  const baseSha = data.base.sha;

  core.setOutput('head_sha', headSha);
  core.setOutput('base_sha', baseSha);
  core.setOutput('title', data.title);
  core.setOutput('body', data.body);
});
