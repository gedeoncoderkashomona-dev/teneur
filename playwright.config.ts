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
    command: 'npm run start -- -p 3010',
    url: 'http://127.0.0.1:3010',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
