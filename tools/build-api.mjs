import { build } from 'esbuild';

await build({
  entryPoints: {
    main: 'apps/api/src/main.ts',
    'migrate-images': 'apps/api/src/migrate-images.ts',
  },
  outdir: 'dist/apps/api',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: true,
  tsconfig: 'tsconfig.base.json',
});
