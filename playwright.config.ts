import { defineConfig, devices } from '@playwright/test';

const origin = 'http://127.0.0.1:3190';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL: origin,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run build && npm start',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
    url: origin,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: '3190',
      PUBLIC_SITE_URL: origin,
      CONTACT_EMAIL: 'test@questboard.test',
    },
  },
});
