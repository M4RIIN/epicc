import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:3190', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:3190/api/health',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: '3190',
      INTERNAL_API_ORIGIN: 'http://127.0.0.1:3190',
      PUBLIC_SITE_URL: 'http://127.0.0.1:3190',
    },
  },
});
