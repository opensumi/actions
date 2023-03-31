import * as core from '@actions/core';
import undici from 'undici';

async function main() {
  try {
    const tokenServer = core.getInput('token-server');
    const flag = core.getInput('flag');

    if (process.env.GITHUB_TOKEN && process.env.__OPENSUMI_BOT__) {
      await undici.request(tokenServer, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `flag ${flag}`,
          Token: process.env.GITHUB_TOKEN,
        },
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
