import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.TEST_FRONTEND_URL ?? 'http://localhost:3001';
const backendUrl = process.env.TEST_BACKEND_URL ?? 'http://localhost:5002';

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
    {
      command: 'npm --prefix server run start',
      url: `${backendUrl}/api/services`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        PORT: new URL(backendUrl).port || '5002',
        DATABASE_PATH: 'services.test.db'
      }
    },
    {
      command: 'npm --prefix client run start',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: new URL(frontendUrl).port || '3001',
        REACT_APP_API_URL: backendUrl
      }
    }
  ]
});
