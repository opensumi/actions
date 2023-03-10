import { OpenAIClient } from 'openai-fetch';
import cp from 'child_process';
import { promisify } from 'node:util';

export async function generateCodeReview(title: string, content: string) {
  const openai = new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `用户输入的是某次 pr 的 diff 文件，该 PR 的名字为：${title}。你有两个任务：1. 进行 Code Review，检查代码中是否有明显的错误，typo 等信息。2. 为该次 PR 生成合适的 PR title 和 commit message，commit message 应遵循 Angular 规范。`,
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
  const msg = await generateCodeReview('local', result.stdout);
  console.log(`ChatGPT Result:`, msg);
  return msg;
}
