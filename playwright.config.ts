import { defineConfig, devices } from '@playwright/test';

const useDevServer =
  process.env.PLAYWRIGHT_USE_DEV_SERVER === 'true' ||
  process.env.PLAYWRIGHT_USE_DEV_SERVER === '1';
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_SERVER === 'true' ||
  process.env.PLAYWRIGHT_REUSE_SERVER === '1' ||
  (!process.env.CI && useDevServer);
const skipWebServer =
  process.env.PW_SKIP_WEBSERVER === 'true' ||
  process.env.PW_SKIP_WEBSERVER === '1';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: skipWebServer
    ? undefined
    : {
        command: useDevServer
          ? 'npm run dev'
          : 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer,
        timeout: 240000,
      },

  /* Global setup */
  // globalSetup: './e2e/global-setup.ts', // Commented out for initial testing

  /* Global teardown */
  // globalTeardown: './e2e/global-teardown.ts', // Commented out for initial testing

  /* Test timeout */
  timeout: 120000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});
