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
const webServerTimeout = Number.parseInt(
  process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS ?? '900000',
  10,
);

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
  /* Workers in CI: 2026-05-15 raised to 3 after measuring real pace.
   *
   * History: was 1 → bumped to 2 earlier this PR. First full-suite
   * run measured 4.2 s avg/test × 806 tests / 2 workers = ~28 min
   * wall time, which hit the 30-min job timeout with zero margin.
   * 3 workers projects to ~19 min wall time, giving the 30-min budget
   * ~10 min of headroom for retries and runner variance.
   *
   * GitHub-hosted ubuntu-latest is 4-vCPU on the current public
   * image, so 3 workers leaves 1 vCPU for the Next dev server. Going
   * to 4 would saturate and risk slowing individual tests (and
   * worsens cross-test database pollution that already exists at 2
   * workers). If we ever need more parallelism than this, the right
   * next step is sharding (parallel jobs) rather than pushing
   * per-job worker count higher.
   */
  workers: process.env.CI ? 3 : undefined,
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
        timeout: Number.isFinite(webServerTimeout) ? webServerTimeout : 900000,
      },

  /* Global setup */
  globalSetup: './e2e/global-setup.ts',

  /* Global teardown */
  globalTeardown: './e2e/global-teardown.ts',

  /* Test timeout */
  timeout: 120000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});
