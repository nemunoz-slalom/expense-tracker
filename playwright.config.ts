import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.TEST_FRONTEND_URL ?? 'http://localhost:3001';
const backendUrl = process.env.TEST_BACKEND_URL ?? 'http://localhost:5001';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
      url: `${backendUrl}/api/services`,
    {
      command: 'npm --prefix client run start:test',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
