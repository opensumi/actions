/**
 * This action is used to backport a PR to a specific branch.
 * It will create a new PR with the same title and body.
 * It will also add a label to the new PR.
 *
 * refer to: <https://github.com/electron/trop/blob/1db87f983ca662a4b50bd2c3c90572f8f649f62e/src/utils.ts#L399>
 */
import { call, getGitHubToken } from './core';
import * as fs from 'fs-extra';
import Queue from 'p-queue';
import { fetch } from 'undici';
import { getDateString } from './utils';
import { execAsync } from './utils/exec';

call(async ({ github, context, core, meta }) => {
  const token = getGitHubToken();
  const owner = process.env.OWNER;
  const repo = process.env.REPO;
  const pullNumber = parseInt(process.env.PULL_NUMBER);
  const { data } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  // base <- head
  const headSha = data.head.sha;
  const baseSha = data.base.sha;

  core.setOutput('head_sha', headSha);
  core.setOutput('base_sha', baseSha);
  core.setOutput('title', data.title);
  core.setOutput('body', data.body);

  if (process.env.TARGET_BRANCH) {
    const targetBranch = process.env.TARGET_BRANCH;

    const commits = (
      await github.paginate(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}/commits',
        { pull_number: pullNumber, per_page: 100, owner, repo }
      )
    ).map((commit) => commit.sha);

    if (commits.length == 0) {
      core.setFailed('No commits found in pull request:' + pullNumber);
      return;
    }
    // Over 240 commits is probably the limit from GitHub so let's not bother.
    if (commits.length >= 240) {
      core.setFailed('Too many commits(>= 240) in pull request:' + pullNumber);
      return;
    }

    const patches: string[] = new Array(commits.length).fill('');
    const q = new Queue({
      concurrency: 5,
      autoStart: false,
    });
    q.clear();

    for (const [i, commit] of commits.entries()) {
      q.add(async () => {
        const patchUrl = `https://api.github.com/repos/${meta.slug}/commits/${commit}`;
        const patchBody = await fetch(patchUrl, {
          headers: {
            Accept: 'application/vnd.github.VERSION.patch',
            Authorization: `token ${token}`,
          },
        });
        patches[i] = await patchBody.text();
      });
    }

    q.start();

    await q.onEmpty();

    const dir = process.env.CODEBASE_PATH;

    async function exec(cmd: string, options: { ignoreError?: boolean } = {}) {
      if (options.ignoreError) {
        try {
          return await execAsync(cmd, { cwd: dir });
        } catch (err) {
          return err;
        }
      }

      return await execAsync(cmd, { cwd: dir });
    }

    await exec('git am --abort', { ignoreError: true });
    // Cherry pick the commits to be backported.
    const patchPath = `${dir}.patch`;

    for (const patch of patches) {
      try {
        await fs.writeFile(patchPath, patch, 'utf8');
        await exec(['git', 'am', '-3', '--keep-cr', patchPath].join(' '));
      } catch (error) {
        console.error(
          'backportCommitsToBranch',
          `Failed to apply patch to ${targetBranch}`,
          error
        );

        return false;
      } finally {
        if (await fs.pathExists(patchPath)) {
          await fs.remove(patchPath);
        }
      }
    }
    // Push the commit to the target branch on the remote.
    const newBranch = `backport/queue/${pullNumber}-${getDateString(
      Date.now(),
      'yyyyMMddhhmmss'
    )}`;

    await exec(`git checkout -b ${newBranch}`);
    await exec(`git push -u origin ${newBranch}`);

    const pull = await github.rest.pulls.create({
      owner,
      repo,
      title: data.title,
      body: `${
        data.body
      }\n\n---\n\nBackport from #${pullNumber} ${headSha.slice(
        0,
        10
      )}\n\nThanks to @${data.user.login} for your valuable contribution.`,
      head: newBranch,
      base: targetBranch,
    });

    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pull.data.number,
      labels: ['🚧 backport'],
    });
  }
});
