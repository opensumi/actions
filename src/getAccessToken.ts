import { call } from './core';

call(async ({ github, context, core }) => {
  const tokenServer = core.getInput('token-server');
  const flag = core.getInput('flag');

  const token = await fetch(tokenServer, {
    headers: {
      Authorization: `flag ${flag}`,
    },
  });

  core.setOutput('token', (await token.json()).token);
});
