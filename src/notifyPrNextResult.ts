import { call } from './core';
import { createVersionText } from './helpers';
import { getRepo } from './utils/context';
import { getISOString } from './utils/time';

call(async ({ github, context, core }) => {
  const commentBody = createVersionText(
    'PR Next',
    process.env.CURRENT_VERSION!,
  );

  const repo = getRepo(context);
  const issueNumber = process.env.ISSUE_NUMBER
    ? parseInt(process.env.ISSUE_NUMBER)
    : context.issue.number;

  await github.rest.issues.createComment({
    ...repo,
    issue_number: issueNumber,
    body: commentBody,
  });

  await github.rest.checks.update({
    ...repo,
    status: 'completed',
    completed_at: getISOString(),
    conclusion: 'success',
    check_run_id: parseInt(process.env.CHECK_RUN_ID),
    output: {
      title: 'PR Next Version publish successful!',
      summary: `A version for pull request is **published**. version: **${process.env.CURRENT_VERSION}**
workflow: ${context.workflow}\n
URL: https://github.com/opensumi/actions/actions/workflows/release-next.yml`,
    },
  });
});
