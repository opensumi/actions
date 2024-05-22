import { readFileSync } from 'fs';
import { Context } from './core';

export const createVersionText = (type = 'Pre-Release', version: string) => {
  return (
    `<!-- versionInfo: ${type} | ${version} -->\n\n` +
    `🎉 ${type} publish successful!\n\n` +
    '```\n' +
    version +
    '\n' +
    '```\n' +
    readSummary()
  );
};

/**
 * GitHub 的 Summary 只是某个 step 的，所以在当前 step 无法查到上个 step 的日志
 */
export const readSummary = () => {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return '';
  }
  return readFileSync(process.env.GITHUB_STEP_SUMMARY).toString();
};

export function getUserLogin(context: Context) {
  return context.payload.sender.login;
}
