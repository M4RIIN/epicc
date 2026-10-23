import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      '@epicc/content-contracts': fileURLToPath(
        new URL('../../libs/content/contracts/src/index.ts', import.meta.url),
      ),
    },
  },
  build: { emptyOutDir: true },
  server: {
    proxy: {
      '/api': {
        target: process.env.INTERNAL_API_ORIGIN ?? 'http://127.0.0.1:3101',
      },
    },
  },
});
