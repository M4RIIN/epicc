import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      ['domain', 'application', 'infrastructure', 'contracts'].map((layer) => [
        `@epicc/content-${layer}`,
        fileURLToPath(
          new URL(`./libs/content/${layer}/src/index.ts`, import.meta.url),
        ),
      ]),
    ),
  },
  test: {
    environment: 'node',
    include: ['apps/**/*.test.ts', 'libs/**/*.test.ts'],
    coverage: { include: ['libs/**/src/**/*.ts', 'apps/api/src/app.ts'] },
  },
});
