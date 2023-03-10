import { OpenAIClient } from 'openai-fetch';

export async function translateTo(content: string, targetLang: string) {
  const openai = new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `将用户输入的文本翻译为 ${targetLang}. 这是一个 Markdown 文件, 不需要翻译代码块里的内容。用户的文本是和计算机有关的，翻译用词需要精准。请尽可能完整的输出结果，不要输出一半。`,
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
