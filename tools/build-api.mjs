import { build } from 'esbuild';

await build({
  entryPoints: ['apps/api/src/main.ts'],
  outfile: 'dist/apps/api/main.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: true,
  tsconfig: 'tsconfig.base.json',
});
