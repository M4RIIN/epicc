import { defineConfig, devices } from '@playwright/test';
import { testDatabaseName, testDatabaseUrl } from './e2e/database';

const database = (process.env.EPICC_E2E_DATABASE ??= testDatabaseName('e2e'));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:3190', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/management.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'gestion',
      testMatch: '**/management.spec.ts',
      dependencies: ['chromium'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && node --import tsx e2e/server.ts',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
    url: 'http://127.0.0.1:3190/api/health',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: 'production',
      PORT: '3190',
      DATABASE_URL: testDatabaseUrl(database),
      ADMIN_EMAIL: 'test@questboard.test',
      ADMIN_PASSWORD: 'testtest',
      SESSION_SECRET: 'secret-de-test-deterministe-avec-plus-de-32-caracteres',
      INTERNAL_API_ORIGIN: 'http://127.0.0.1:3190',
      PUBLIC_SITE_URL: 'http://127.0.0.1:3190',
    },
  },
});
