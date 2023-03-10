import cp from 'child_process';
import { promisify } from 'node:util';
import { generateCommitMessage } from './openai/generate-commit-message';

const execAsync = promisify(cp.exec);

export async function generate(base: string, head: string) {
  const result = await execAsync(`git diff ${base} ${head}`, {
    cwd: process.cwd(),
  });
  const msg = await generateCommitMessage(result.stdout);
  console.log(`ChatGPT Result:`, msg);
}
