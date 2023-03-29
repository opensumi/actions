import { call } from './core';

call(async ({ github, context, core }) => {
  const tokenServer = core.getInput('token-server');
  const flag = core.getInput('flag');

  const token = await fetch(tokenServer, {
    headers: {
      Authorization: `flag ${flag}`,
    },
  });

  const tokenStr = (await token.json()).token;

  core.exportVariable('GITHUB_TOKEN', tokenStr);
  core.setOutput('token', tokenStr);
  core.setSecret(tokenStr);
});
