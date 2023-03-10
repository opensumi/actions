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
        content: `用户输入的是某次pr的diff文件，该PR的名字为：${title}。你有两个任务：1.进行 CodeReview，检查代码中是否有明显的错误，typo 等信息。2. 为该次 PR 生成合适的 PR title 和 commit message，PR title 和 commit message 应遵循 Angular 规范。\n\n你的回复要尽可能的精简，准确；不要输出除了答案之外多余的内容。`,
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
