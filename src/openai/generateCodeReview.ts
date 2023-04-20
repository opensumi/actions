import { OpenAIClient } from 'openai-fetch';
import { execAsync } from '../utils/exec';

export async function generateCodeReview(
  title: string,
  body: string,
  content: string
) {
  const openai = new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `用户请求对他的代码进行审查，用户会提供他本次代码的一个变更简介和一个 git diff 文件。你是一个严谨的 CodeReview 模型。你有三个任务：一是对代码进行 CodeReview，理解代码。二是检查代码中是否有明显的错误，typo 等信息，给出一些修改建议。三是生成合适的 commit message，commit message 应遵循 Angular 规范。你输出的内容要尽可能的精简和准确，用户已经熟知 Angular 规范是什么，你的输出内容中不需要介绍 Angular 规范。`,
      },
      {
        role: 'user',
        content: `简介: ${title}, 详细内容：${body}\n\ndiff: ${content}`,
      },
    ],
  });

  const result = completion.message;
  return result.content;
}

export async function generateLocal(base: string, head: string) {
  const result = await execAsync(`git diff ${base} ${head}`, {
    cwd: process.cwd(),
  });
  const msg = await generateCodeReview('local', '', result.stdout);
  console.log(`ChatGPT Result:`, msg);
  return msg;
}
