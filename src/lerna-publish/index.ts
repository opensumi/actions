import { call } from '../core';
import dayjs from 'dayjs';
import { execAsync } from '../utils/exec';

function handleSha(sha: string) {
  if (!sha) {
    return 'next';
  }
  return sha.replace(/[/\\-]/g, ' ').slice(0, 6);
}

function handleBranch(branch: string) {
  if (!branch) {
    return 'next';
  }

  const tmp = branch.replace(/[/\\-]/g, ' ');

  if (tmp.length > 6) {
    // 前三个和后三个
    return `${tmp.slice(0, 3)}${tmp.slice(-3)}`;
  }

  return tmp;
}

call(async ({ github, context, core, meta }) => {
  const dateString = dayjs().format('YYYYMMDDHHmmss');
  let sha = '';
  if (process.env.SHA) {
    sha = handleSha(process.env.SHA);
  } else {
    sha = handleBranch(process.env.GITHUB_REF);
  }

  const version = `0.0.${dateString}-${sha}.0`;
  core.info(`Publishing ${version}`);
  await execAsync(`lerna version ${version} --exact --no-push --yes`);
  await execAsync(
    `lerna publish from-package --dist-tag next --force-publish='*' --no-push --no-git-tag-version --ignore-prepublish --ignore-scripts -y`,
  );
});
