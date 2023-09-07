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
    model: 'gpt-4-32k',
    messages: [
      {
        role: 'system',
        content: `你是一个计算机行业的高级技术专家，你熟悉 Webpack/TypeScript/JavaScript/Node.js，你的任务是审查用户提交的代码（用户会提交代码的简介和本次变更的代码（以 diff 的形式发送给你）），请你在理解用户的代码后，进行以下任务:
1. 检查代码是否存在错误、错误拼写，并提出修改建议
2. 描述代码的功能

请注意，你输出的内容要遵循以下原则：
1. 输出要精简和准确`,
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
  console.log(`GPT Result:`, msg);
  return msg;
}
