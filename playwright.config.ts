import { defineConfig, devices } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const database = (process.env.EPICC_E2E_DATABASE ??= join(
  tmpdir(),
  `epicc-e2e-${randomUUID()}.sqlite`,
));

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/teardown.ts',
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
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:3190/api/health',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: '3190',
      CLIENTS_DB_PATH: database,
      ADMIN_EMAIL: 'test@questboard.test',
      ADMIN_PASSWORD: 'testtest',
      SESSION_SECRET: 'secret-de-test-deterministe-avec-plus-de-32-caracteres',
      INTERNAL_API_ORIGIN: 'http://127.0.0.1:3190',
      PUBLIC_SITE_URL: 'http://127.0.0.1:3190',
    },
  },
});
