import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3010',
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'mobile-iphone-chrome',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'npm run start -- -p 3010',
    url: 'http://127.0.0.1:3010',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
