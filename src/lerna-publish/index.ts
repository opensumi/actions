import { call } from '../core';
import dayjs from 'dayjs';
import { execAsync } from '../utils/exec';
import { removePrefix } from '../utils';

const branchPrefix = 'refs/heads/';
function preprocess(str: string) {
  return removePrefix(str, branchPrefix).replace(/[/\\ -]/g, '');
}

function handleSha(sha: string) {
  if (!sha) {
    return 'next';
  }
  return preprocess(sha).slice(0, 8);
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
  let sha = '';
  if (process.env.GITHUB_REF) {
    core.info(`Using GITHUB_REF ${process.env.GITHUB_REF}`);
    sha = handleSha(process.env.GITHUB_REF);
  } else {
    core.info(`Using branch ${process.env.HEAD_SHA}`);
    sha = handleBranch(process.env.HEAD_SHA);
  }

  await execAsync(`git checkout -b publish/${sha}`);
  const version = `0.0.${dateString}-${sha}.0`;
  core.info(`Publishing ${version}`);
  await execAsync(`lerna version ${version} --exact --no-push --yes`);
  await execAsync(
    `lerna publish from-package --dist-tag next --force-publish='*' --no-push --no-git-tag-version --ignore-prepublish --ignore-scripts -y`,
  );
});
