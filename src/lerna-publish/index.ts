import { call } from '../core';
import dayjs from 'dayjs';
import { execAsync } from '../utils/exec';

call(async ({ github, context, core, meta }) => {
  const dateString = dayjs().format('YYYYMMDDHHmmss');
  const headSha = process.env.HEAD_SHA!.slice(0, 6);

  const version = `0.0.${dateString}-${headSha}.0`;

  core.info(`Publishing ${version}`);

  const command = `lerna publish ${version} --dist-tag next --force-publish='*' --no-push --no-git-tag-version --ignore-prepublish --ignore-scripts --version-private -y`;
  await execAsync(command);
});
