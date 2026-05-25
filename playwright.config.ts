import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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

/* Pre-seed the cookie-consent banner state so the banner doesn't intercept
 * hero/footer CTA clicks. We write a static storageState file under
 * `playwright/.consent-state.json` — outside `test-results/` (which
 * Playwright cleans before every run, breaking the file:storageState
 * pattern that lived there during the 2026-05-24 audit). The file is
 * deterministic per baseURL and idempotent; this block runs at config
 * load time so the file exists before the first context is created. */
const CONSENT_STATE_PATH = path.join(
  __dirname,
  'playwright',
  '.consent-state.json',
);
(function ensureConsentStorageState() {
  try {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    let hostname = 'localhost';
    try {
      hostname = new URL(baseUrl).hostname;
    } catch {
      hostname = 'localhost';
    }
    fs.mkdirSync(path.dirname(CONSENT_STATE_PATH), { recursive: true });
    fs.writeFileSync(
      CONSENT_STATE_PATH,
      JSON.stringify(
        {
          cookies: [
            {
              name: 'formaos_cookie_consent',
              value: 'rejected',
              domain: hostname,
              path: '/',
              expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
              httpOnly: false,
              secure: false,
              sameSite: 'Lax' as const,
            },
          ],
          origins: [],
        },
        null,
        2,
      ),
    );
  } catch {
    /* Non-fatal — if the file can't be written, tests run with no
     * pre-seeded consent and the cookie banner appears as usual. */
  }
})();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Default test discovery matches *.spec.ts only. Capture-only suites
   * (screenshots without assertions) are named *.capture.ts so they're
   * excluded from `playwright test` and `npm run test:e2e` — they don't
   * inflate the pass count. They can still be invoked directly by
   * filename (see `test:visual` in package.json). */
  testMatch: '**/*.spec.ts',
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

    /* Audit 2026-05-25: cookie-consent banner intercepts hero/footer CTA
     * clicks in fresh contexts. The file at CONSENT_STATE_PATH is written
     * at config-load time (above) so it exists before the first context is
     * created, and it lives outside test-results/ which Playwright cleans
     * on every run. The GDPR compliance suite opens its own context with
     * a fresh cookie jar, so its banner-existence assertion is unaffected. */
    storageState: CONSENT_STATE_PATH,

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
