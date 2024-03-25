import path from 'path';
import { build } from 'esbuild';
import { cleanPlugin } from 'esbuild-clean-plugin';

build({
  entryPoints: [
    'src/createPrNextCheckSuite.ts',
    'src/notifyPreReleaseResult.ts',
    'src/notifyPrNextResult.ts',
    'src/notifyRCResult.ts',
    'src/code-review.ts',
    'src/bot-token/get-access-token.ts',
    'src/bot-token/revoke-token.ts',
    'src/parse-pr-data/index.ts',
    'src/permissionCheck.js',
  ],
  metafile: true,
  outdir: path.join(__dirname, './lib'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  chunkNames: 'chunks/[name]-[hash]',
  target: 'node14',
  banner: {
    js: '// This file is generated by @opensumi/actions',
  },
  treeShaking: true,
  plugins: [cleanPlugin({})],
});
