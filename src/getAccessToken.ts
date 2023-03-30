import * as core from '@actions/core';

async function main() {
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
}

main();
