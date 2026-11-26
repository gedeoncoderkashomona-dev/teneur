import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  timeout: 45000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3011',
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'iphone-14-15',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        channel: 'chrome',
      },
    },
    {
      name: 'iphone-16-18-pro',
      use: {
        viewport: { width: 402, height: 874 },
        isMobile: true,
        hasTouch: true,
        channel: 'chrome',
      },
    },
    {
      name: 'iphone-pro-max',
      use: {
        viewport: { width: 440, height: 956 },
        isMobile: true,
        hasTouch: true,
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'npm run start -- -p 3011',
    url: 'http://127.0.0.1:3011',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
