/**
 * Mobile form-ergonomics: assert representative inputs across the app
 * carry sensible inputMode / autoComplete / enterKeyHint hints so the
 * iOS / Android keyboard surface matches the field semantics, and that
 * input font-size is >= 16px on auth screens (otherwise iOS zooms in).
 *
 * Auth-required routes share the touch-targets spec's session-injection
 * pattern: read the cached e2e session and install it before the test.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Session } from '@supabase/supabase-js';
import { devices, expect, test } from '@playwright/test';
import { setPlaywrightSession } from '../helpers/test-auth';

test.use({ ...devices['iPhone 14'] });

const SESSION_CACHE_PATH = path.join(
  process.cwd(),
  'test-results',
  'e2e-session-cache.json',
);

function loadCachedSession(): Session | null {
  try {
    return JSON.parse(fs.readFileSync(SESSION_CACHE_PATH, 'utf8')) as Session;
  } catch {
    return null;
  }
}

async function authedContext({ context }: { context: import('@playwright/test').BrowserContext }) {
  const session = loadCachedSession();
  if (!session) {
    test.skip(true, 'no cached e2e session — skipping authed coverage');
    return;
  }
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  await setPlaywrightSession(context, session, baseUrl);
}

test.describe('Public auth screens — keyboard hints + iOS no-zoom', () => {
  test('signin email + password expose iOS-friendly attrs', async ({ page }) => {
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });

    const email = page.locator('#email');
    await expect(email).toHaveAttribute('type', 'email');
    await expect(email).toHaveAttribute('autocomplete', 'email');
    await expect(email).toHaveAttribute('inputmode', 'email');
    await expect(email).toHaveAttribute('enterkeyhint', 'next');

    const password = page.locator('#password');
    await expect(password).toHaveAttribute('autocomplete', 'current-password');
    await expect(password).toHaveAttribute('enterkeyhint', 'go');

    // No-zoom: computed font-size must be >= 16px on iOS Safari
    const sizes = await email.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(sizes).toBeGreaterThanOrEqual(16);
  });

  test('signup form has email + new-password autocompletes', async ({ page }) => {
    await page.goto('/auth/signup', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#email')).toHaveAttribute('autocomplete', 'email');
    await expect(page.locator('#email')).toHaveAttribute('inputmode', 'email');

    await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.locator('#confirm-password')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
  });

  test('forgot-password email has reset-flow hints', async ({ page }) => {
    await page.goto('/auth/forgot-password', { waitUntil: 'domcontentloaded' });

    const email = page.locator('#email');
    await expect(email).toHaveAttribute('autocomplete', 'email');
    await expect(email).toHaveAttribute('inputmode', 'email');
    await expect(email).toHaveAttribute('enterkeyhint', 'send');
  });
});

test.describe('Authed app screens — keyboard hints', () => {
  test.beforeEach(authedContext);

  test('/app/incidents search input gets the search keyboard', async ({
    page,
  }) => {
    await page.goto('/app/incidents', { waitUntil: 'domcontentloaded' });
    const search = page.locator('input[name="q"]').first();
    await expect(search).toHaveAttribute('type', 'search');
    await expect(search).toHaveAttribute('enterkeyhint', 'search');
  });

  test('/app/forms search input gets the search keyboard', async ({
    page,
  }) => {
    await page.goto('/app/forms', { waitUntil: 'domcontentloaded' });
    const search = page.locator('input[name="q"]').first();
    await expect(search).toHaveAttribute('type', 'search');
    await expect(search).toHaveAttribute('enterkeyhint', 'search');
  });

  test('/app/participants/new has phone tel keyboard + email/name autocompletes', async ({
    page,
  }) => {
    await page.goto('/app/participants/new', { waitUntil: 'domcontentloaded' });

    const fullName = page.locator('input[name="full_name"]');
    await expect(fullName).toHaveAttribute('autocomplete', 'name');

    const phone = page.locator('input[name="phone"]');
    await expect(phone).toHaveAttribute('inputmode', 'tel');
    await expect(phone).toHaveAttribute('autocomplete', 'tel');

    const emergencyPhone = page.locator('input[name="emergency_contact_phone"]');
    await expect(emergencyPhone).toHaveAttribute('inputmode', 'tel');

    const email = page.locator('input[name="email"]');
    await expect(email).toHaveAttribute('inputmode', 'email');
    await expect(email).toHaveAttribute('autocomplete', 'email');
  });
});
