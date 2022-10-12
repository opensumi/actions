import path from 'path';
import { build } from 'esbuild';
import { cleanPlugin } from 'esbuild-clean-plugin';

build({
  entryPoints: [
    'src/createPrNextCheckSuite.ts',
    'src/notifyPreReleaseResult.ts',
    'src/notifyPrNextResult.ts',
    'src/notifyRCResult.ts',
  ],
  metafile: true,
  outdir: path.join(__dirname, './lib'),
  bundle: true,
  splitting: true,
  platform: 'node',
  format: 'esm',
  chunkNames: 'chunks/[name]-[hash]',
  target: 'node14',
  banner: {
    js: '// This file is generated by @opensumi/actions',
  },
  treeShaking: true,
  plugins: [cleanPlugin({})],
});
