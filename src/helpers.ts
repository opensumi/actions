import { readFile } from 'fs/promises';
import { Context } from './core';

export const createVersionText = (
  type = 'Pre-Release',
  version: string,
  context: Context
) => {
  if (!context.payload.comment) {
    return '';
  }
  return (
    `🎉 ${type} version ` +
      version +
      ' publish successful! You can install prerelease version via `npm install package@' +
      version +
      ' `' +
      ' [@' +
      context.payload.comment.user.login +
      ']' +
      '(https://github.com/' +
      context.payload.comment.user.login +
      ')\n\n' +
      '```\n' +
      version +
      '\n' +
      '```\n' +
      process.env.GITHUB_STEP_SUMMARY ?? ''
  );
};

/**
 * GitHub 的 Summary 只是某个 step 的，所以在当前 step 无法查到上个 step 的日志
 */
export const readSummary = async () => {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return '';
  }
  return (await readFile(process.env.GITHUB_STEP_SUMMARY)).toString();
};
