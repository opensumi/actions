import { call } from '../core';
import dayjs from 'dayjs';
import { execAsync } from '../utils/exec';
import { removePrefix } from '../utils';

const branchPrefix = 'refs/heads/';
function preprocess(str: string) {
  return removePrefix(str, branchPrefix).replace(/[/\\ -]/g, '');
}


function handleBranch(branch: string) {
  if (!branch) {
    return 'next';
  }

  const tmp = preprocess(branch);

  if (tmp.length > 8) {
    return `${tmp.slice(0, 4)}${tmp.slice(-4)}`;
  }

  return tmp;
}

call(async ({ github, context, core, meta }) => {
  const dateString = dayjs().format('YYYYMMDDHHmmss');

  core.info(`Using ref ${process.env.HEAD_REF}`);
  const sha = handleBranch(process.env.HEAD_REF);

  await execAsync(`git checkout -b publish/${sha}`);
  const version = `0.0.${dateString}-${sha}.0`;
  core.info(`Publishing ${version}`);
  await execAsync(`lerna version ${version} --exact --no-push --yes`);
  await execAsync(
    `lerna publish from-package --dist-tag next --force-publish='*' --no-push --no-git-tag-version --ignore-prepublish --ignore-scripts -y`,
  );
});
