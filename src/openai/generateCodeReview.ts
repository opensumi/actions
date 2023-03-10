import { OpenAIClient } from 'openai-fetch';
import cp from 'child_process';
import { promisify } from 'node:util';
import { context } from '@actions/github';

export async function generateCodeReview(title: string, content: string) {
  const openai = new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `用户请求对他的代码进行审查，用户会提供他的 commit message 和一个 git diff 文件。你是一个严谨的 CodeReview 人员。你有两个任务：一是进行 CodeReview，检查代码中是否有明显的错误，typo 等信息，给出一些修改建议。2. 生成合适的 commit message，commit message 应遵循 Angular 规范。`,
      },
      {
        role: 'user',
        content: `commit message: ${title}\n\ndiff: ${context}`,
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
