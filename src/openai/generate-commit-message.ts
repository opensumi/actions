import { OpenAIClient } from 'openai-fetch';
import cp from 'child_process';
import { promisify } from 'node:util';

export async function generateCommitMessage(content: string) {
  const openai = new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `用户输入的是某次 pr 的 diff 文件，你有两个任务，一是进行 Code Review，最好使用中文。二是为它生成一条合适的 commit message，commit message 应遵循 Angular 规范，commit message 最好使用英文。`,
      },
      {
        role: 'user',
        content: content,
      },
    ],
  });

  const result = completion.message;
  return result.content;
}

const execAsync = promisify(cp.exec);

export async function generateLocal(base: string, head: string) {
  const result = await execAsync(`git diff ${base} ${head}`, {
    cwd: process.cwd(),
  });
  const msg = await generateCommitMessage(result.stdout);
  console.log(`ChatGPT Result:`, msg);
  return msg;
}
