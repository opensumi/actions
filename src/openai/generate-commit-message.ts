import { OpenAIClient } from 'openai-fetch';

export async function generateCommitMessage(content: string) {
  const openai = new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `用户输入的是某次 pr 的 diff 文件，你有两个任务，一是用中文进行 Code Review。二是用英文为它生成一条合适的 commit message，commit message 应遵循 Angular 规范。`,
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
