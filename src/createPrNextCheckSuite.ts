import { call } from './core';
import { getRepo } from './utils/context';

call(async ({ github, context, core }) => {
  const status = process.env.STATUS || 'start';
  const repo = getRepo(context);
  if (status === 'start') {
    // 创建一个 checkSuite
    const suite = await github.rest.checks.createSuite({
      ...repo,
      head_sha: process.env.HEAD_SHA!,
    });

    // 创建一个 checkRun
    const check = await github.rest.checks.create({
      ...repo,
      name: '🚀🚀🚀 Pre-Release Version for pull request',
      status: 'in_progress',
      head_sha: suite.data.head_sha,
      output: {
        title: 'Pre-Release version is publishing. Please wait for a moment...',
        summary: `A version for pull request is **running**. sha: **${process.env.HEAD_SHA}**`,
      },
    });
    core.exportVariable('CHECK_RUN_ID', check.data.id);
  } else {
    await github.rest.checks.update({
      ...repo,
      status: 'completed',
      completed_at: new Date(),
      conclusion: 'failure',
      check_run_id: process.env.CHECK_RUN_ID,
      output: {
        title: 'Pre-Release Version publish failed',
        summary:
          'A version for pull request is **failed**. please check the error.',
      },
    });
  }
});
