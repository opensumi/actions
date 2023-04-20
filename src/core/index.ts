import * as core from '@actions/core';
import { context } from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { Octokit } from '@octokit/rest';

export type { Context };

process.on('unhandledRejection', handleError);

interface Options {
  userAgent?: string;
  previews?: string[];
}

interface ICallOptions {
  encoding?: 'json' | 'string';
}

interface IMeta {
  slug: string;
}

interface AsyncFunctionArguments {
  context: Context;
  core: typeof core;
  github: Octokit;
  meta: IMeta;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export type AsyncFunction = (args: AsyncFunctionArguments) => Promise<any>;

export async function call(
  asyncFunction: AsyncFunction,
  callOptions: ICallOptions = {}
): Promise<void> {
  const token = getGitHubToken();
  const previews = core.getInput('previews');

  const opts: Options = {};

  if (previews != null) {
    opts.previews = previews.split(',');
  }

  const github = new Octokit({
    auth: token,
  });
  const meta = {
    slug: `${context.repo.owner}/${context.repo.repo}`,
  } as IMeta;

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
  const result = await asyncFunction({
    github,
    context,
    core,
    meta,
  });

  let encoding = callOptions.encoding;
  encoding = encoding ? encoding : 'json';

  let output;

  switch (encoding) {
    case 'json':
      output = JSON.stringify(result);
      break;
    case 'string':
      output = String(result);
      break;
    default:
      throw new Error('"result-encoding" must be either "string" or "json"');
  }

  core.setOutput('result', output);
}

function handleError(err: any): void {
  console.error(err);
  core.setFailed(`Unhandled error: ${err}`);
}

export function getGitHubToken() {
  const token =
    process.env.GITHUB_TOKEN ??
    core.getInput('github-token', { required: true });
  return token;
}
