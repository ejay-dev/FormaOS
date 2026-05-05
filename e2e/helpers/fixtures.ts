/**
 * Shared E2E Test Fixtures
 *
 * Provides reusable `loginAs`, `getCredentials`, and `dismissProductTour`
 * helpers so spec files don't copy-paste the same boilerplate.
 *
 * Usage:
 *   import { loginAs, getCredentials, dismissProductTour } from './helpers/fixtures';
 *
 * Migration: Replace inline copies in spec files with imports from here.
 */

import { test, type Page } from '@playwright/test';
import {
  E2EAuthBootstrapError,
  createMagicLinkSession,
  createPasswordSession,
  getTestCredentials,
  setPlaywrightSession,
} from './test-auth';

let cachedCredentials: { email: string; password: string } | null = null;
const cachedSessions = new Map<
  string,
  Awaited<ReturnType<typeof createPasswordSession>>
>();
const BOOTSTRAP_ATTEMPTS = 5;
const BOOTSTRAP_REQUEST_TIMEOUT_MS = 45_000;

/**
 * Get test credentials from env vars or create a temporary test user.
 * Caches per-process so the first call resolves credentials for the run.
 */
export async function getCredentials(): Promise<{
  email: string;
  password: string;
}> {
  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    if (cachedCredentials) return cachedCredentials;
    cachedCredentials = {
      email: process.env.E2E_TEST_EMAIL,
      password: process.env.E2E_TEST_PASSWORD,
    };
    return cachedCredentials;
  }

  try {
    return await getTestCredentials();
  } catch (error) {
    if (error instanceof E2EAuthBootstrapError) {
      test.skip(true, error.message);
      return undefined as never; // unreachable — test.skip throws internally
    }
    throw error;
  }
}

type AppReadyOptions = {
  expectedPath?: string;
  timeout?: number;
};

function pathMatches(actualPath: string, expectedPath: string) {
  const normalized = expectedPath.endsWith('/')
    ? expectedPath.slice(0, -1)
    : expectedPath;

  if (normalized === '/app') {
    return actualPath === '/app' || actualPath.startsWith('/app/');
  }

  return actualPath === normalized || actualPath.startsWith(`${normalized}/`);
}

/**
 * Wait for the app shell to be usable without relying on network silence.
 * FormaOS intentionally keeps background telemetry/activity requests alive.
 */
export async function waitForAppReady(
  page: Page,
  options: AppReadyOptions = {},
): Promise<void> {
  const timeout = options.timeout ?? 15000;
  const expectedPath = options.expectedPath ?? '/app';

  await page
    .waitForLoadState('domcontentloaded', { timeout: Math.min(timeout, 5000) })
    .catch(() => {});

  const currentUrl = page.url();
  const currentPath =
    currentUrl && currentUrl !== 'about:blank'
      ? new URL(currentUrl).pathname
      : '';

  if (!pathMatches(currentPath, expectedPath)) {
    await page
      .waitForURL(
        (url) => pathMatches(new URL(url).pathname, expectedPath),
        { timeout },
      )
      .catch(() => {
        throw new Error(
          `Expected FormaOS app route ${expectedPath}, current URL is ${page.url()}`,
        );
      });
  }

  await page.locator('body').waitFor({ state: 'visible', timeout });
  await page
    .waitForFunction(
      () => (document.body?.innerText ?? '').trim().length > 0,
      undefined,
      { timeout: Math.min(timeout, 5000) },
    )
    .catch(() => {});
}

export async function gotoAppRoute(
  page: Page,
  path = '/app',
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'commit', timeout: 30_000 });
      await dismissProductTour(page);
      await waitForAppReady(page, { expectedPath: path });
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('Timeout') ||
        message.includes('ECONNRESET') ||
        message.includes('ERR_CONNECTION_RESET') ||
        message.includes('ERR_NETWORK_CHANGED') ||
        message.includes('ERR_ABORTED');

      if (!retryable || attempt === 3) {
        break;
      }

      await page.goto('about:blank', { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(500 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to navigate to ${path}`);
}

function isTransientBootstrapError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Timeout') ||
    message.includes('Target page, context or browser has been closed') ||
    message.includes('ECONNRESET') ||
    message.includes('ERR_CONNECTION_RESET') ||
    message.includes('socket hang up') ||
    message.includes('fetch failed')
  );
}

async function bootstrapSession(page: Page, email: string, password: string) {
  const appBase = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const cachedSession = cachedSessions.get(email);
  let session = cachedSession;

  if (!session || (session.expires_at ?? 0) * 1000 < Date.now() + 60_000) {
    try {
      session = await createPasswordSession(email, password);
    } catch (error) {
      console.warn(
        '[E2E] Password session bootstrap failed, falling back to magic link:',
        error,
      );
      session = await createMagicLinkSession(email);
    }
    cachedSessions.set(email, session);
  }

  await setPlaywrightSession(page.context(), session, appBase);

  let lastError: unknown;
  for (let attempt = 1; attempt <= BOOTSTRAP_ATTEMPTS; attempt += 1) {
    try {
      const response = await page.request.post(`${appBase}/api/auth/bootstrap`, {
        headers: {
          'x-formaos-e2e': '1',
        },
        timeout: BOOTSTRAP_REQUEST_TIMEOUT_MS,
      });

      if (response.ok()) {
        return;
      }

      lastError = new Error(
        `E2E auth bootstrap failed with status ${response.status()}`,
      );
      if (response.status() < 500 && response.status() !== 429) {
        break;
      }
    } catch (error) {
      lastError = error;
      if (!isTransientBootstrapError(error)) {
        break;
      }
    }

    if (attempt < BOOTSTRAP_ATTEMPTS) {
      await page.waitForTimeout(500 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? 'E2E auth bootstrap failed'));
}

/**
 * Log in as a user and wait for the app shell to be usable.
 * Uses direct Supabase session bootstrap when service-role auth is available,
 * then falls back to the UI form for manually supplied credentials.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e_test_mode', 'true');
  });

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await bootstrapSession(page, email, password);
      await gotoAppRoute(page, '/app');
      return;
    } catch (error) {
      if (error instanceof E2EAuthBootstrapError) {
        throw error;
      }
      if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
        throw error;
      }
      console.warn(
        '[E2E] Direct session bootstrap failed, falling back to UI login:',
        error,
      );
    }
  }

  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await waitForAppReady(page, { expectedPath: '/app' });
  await dismissProductTour(page);
}

/**
 * Dismiss the product tour overlay if it appears.
 * Silently succeeds if no tour is shown.
 */
export async function dismissProductTour(page: Page): Promise<void> {
  try {
    await page
      .waitForLoadState('domcontentloaded', { timeout: 5000 })
      .catch(() => {});
    const tourText = page.locator('text="Product Tour"');
    if (await tourText.isVisible({ timeout: 2000 })) {
      const skipBtn = page.locator('button:has-text("Skip Tour")');
      await skipBtn.click({ timeout: 3000 });
      await tourText.waitFor({ state: 'hidden', timeout: 5000 });
    }
  } catch {
    // Tour not present — no action needed
  }
}
