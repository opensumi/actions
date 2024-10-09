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
  core.setOutput('head_sha', data.head.sha);
  core.setOutput('base_sha', data.base.sha);
  core.setOutput('head_ref', data.head.ref);
  core.setOutput('base_ref', data.base.ref);
  core.setOutput('title', data.title);
  core.setOutput('body', data.body);
  core.setOutput('full_name', data.base.repo.full_name);
});
