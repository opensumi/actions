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
        content: `将用户的输入翻译为 ${targetLang}. 这是一个 Markdown 文件, 不需要翻译代码块和 frontmatter 里的内容。输入文本是和计算机有关的，翻译用词需要精准。`,
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
