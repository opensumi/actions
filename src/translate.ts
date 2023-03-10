import { globby } from 'globby';
import path from 'path';
import fs from 'fs/promises';

import { translateTo } from './openai/translate';

async function translateDocs() {
  const files = await globby(['**/*.zh.md']);
  for (const file of files) {
    console.log(`🚀 ~ file: translate.ts:9 ~ translateDocs ~ file:`, file);
    const filePath = path.join(process.cwd(), file);
    const fileContent = await fs.readFile(filePath, 'utf8');
    console.log('translating ' + file);

    const translatedContent = await translateTo(fileContent, 'english'); // 翻译库函数返回翻译后的文本内容
    const translatedFilePath = filePath.replace(/\.zh\.md$/, '.en.md');
    await fs.writeFile(translatedFilePath, translatedContent);
    return;
  }
}

translateDocs().catch((err) => {
  console.error(err);
  process.exit(1);
});
