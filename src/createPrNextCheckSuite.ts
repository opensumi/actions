import { call } from './core';
import { getRepo } from './utils/context';
import { getISOString } from './utils/time';

call(async ({ github, context, core }) => {
  const status = process.env.STATUS || 'start';
  const workflowPath = process.env.WORKFLOW_PATH || 'release-next.yml';

  const repo = getRepo(context);
  if (status === 'start') {
    try {
      // 创建一个 checkSuite
      await github.rest.checks.createSuite({
        ...repo,
        head_sha: process.env.HEAD_SHA!,
      });
    } catch (error) {
      console.log('createSuite error', error);
    }

    // 创建一个 checkRun
    const check = await github.rest.checks.create({
      ...repo,
      name: '🚀🚀🚀 Next Version for pull request',
      status: 'in_progress',
      head_sha: process.env.HEAD_SHA,
      output: {
        title: 'Next version is publishing. Please wait for a moment...',
        summary: `A version for pull request is **running**. sha: **${process.env.HEAD_SHA}**.\n
workflow: ${context.workflow}\n
URL: https://github.com/opensumi/actions/actions/workflows/${workflowPath}`,
      },
    });
    core.exportVariable('CHECK_RUN_ID', check.data.id);
  } else {
    await github.rest.checks.update({
      ...repo,
      status: 'completed',
      completed_at: getISOString(),
      conclusion: 'failure',
      check_run_id: parseInt(process.env.CHECK_RUN_ID),
      output: {
        title: 'Next Version publish failed',
        summary: `A version for pull request is **failed**. please check the error.\n
workflow: ${context.workflow}\n
URL: https://github.com/opensumi/actions/actions/workflows/${workflowPath}`,
      },
    });
  }
});
