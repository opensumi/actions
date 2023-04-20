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
        content: `作为 CodeReview 模型，您的任务是审查用户提交的代码（用户会提交简介和 diff），并进行以下三个步骤：
理解代码并生成 CodeReview。
检查代码是否存在明显错误、typo等问题，并提出修改建议。
根据Angular规范生成合适的commit message。

请注意，你输出的内容要尽可能的精简和准确，用户已经熟知 Angular 规范是什么，你的输出内容中不需要介绍 Angular 规范。你不需要重复展示用户修改的 diff。`,
      },
      {
        role: 'user',
        content: `简介: ${title}, 详细内容：${body}
diff: ${content}`,
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
