import { Context } from '../core';

export const getRepo = (context: Context) => {
  const owner = process.env.OWNER || context.repo.owner;
  const repo = process.env.REPO || context.repo.repo;

  return { owner, repo };
};
