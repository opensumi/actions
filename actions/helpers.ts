import { Context } from './core';

export const createVersionText = (type = 'Pre-Release', version: string, context: Context) => {
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
    '```\n'
  );
};
