import * as core from '@actions/core';
import undici from 'undici';

async function main() {
  try {
    const tokenServer = core.getInput('token-server');
    const flag = core.getInput('flag');

    const token = await undici.request(tokenServer, {
      headers: {
        Authorization: `flag ${flag}`,
      },
    });

    const tokenStr = (await token.body.json()).token;

    core.exportVariable('GITHUB_TOKEN', tokenStr);
    core.setOutput('token', tokenStr);
    core.setSecret(tokenStr);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
