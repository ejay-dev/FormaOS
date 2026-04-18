/**
 * Full visual sweep — captures screenshots for every key surface area
 * (marketing, authed app, admin) at desktop + mobile widths. These are saved
 * to test-results/visual-sweep/ for human + AI inspection.
 *
 * Not an assertion test: the goal is capture, not pass/fail. Use
 *   PW_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3000 \
 *     npx playwright test e2e/visual-full-sweep.spec.ts --project=chromium
 * to generate the images.
 */

import fs from 'fs';
import path from 'path';
import { test, expect, type Page } from '@playwright/test';
import {
  getTestCredentials,
  isE2EAuthBootstrapError,
} from './helpers/test-auth';

const OUT = path.resolve(process.cwd(), 'test-results/visual-sweep');
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const MARKETING = [
  '/',
  '/evaluate',
  '/govern',
  '/frameworks',
  '/industries',
  '/compare',
  '/compare/vanta',
  '/compare/drata',
  '/compare/secureframe',
  '/compare/auditboard',
  '/compare/hyperproof',
  '/documentation',
  '/faq',
  '/about',
  '/contact',
  '/blog',
  '/customer-stories',
  '/legal/privacy',
  '/legal/terms',
];

const AUTHED = [
  '/app',
  '/app/dashboard',
  '/app/compliance',
  '/app/policies',
  '/app/tasks',
  '/app/people',
  '/app/participants',
  '/app/visits',
  '/app/progress-notes',
  '/app/incidents',
  '/app/staff-compliance',
  '/app/registers',
  '/app/vault',
  '/app/reports',
  '/app/reports/custom',
  '/app/reports/custom/new',
  '/app/capa',
  '/app/capa/new',
  '/app/forms',
  '/app/settings',
  '/app/settings/roles',
  '/app/settings/roles/new',
  '/app/settings/auditor-access',
  '/app/settings/auditor-access/new',
  '/app/activity',
];

async function dismissOverlays(page: Page) {
  // Cookie banner / marketing modal
  for (const sel of [
    'button:has-text("Accept")',
    'button:has-text("Got it")',
    'button:has-text("Skip Tour")',
    'button:has-text("Skip tour")',
    'button[aria-label="Close"]',
  ]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) await btn.click({ timeout: 1000 });
    } catch {
      /* best-effort */
    }
  }
}

async function snap(page: Page, route: string, viewport: 'desktop' | 'mobile') {
  const slug = route.replace(/\//g, '_').replace(/^_/, '') || 'root';
  const file = path.join(OUT, `${slug}__${viewport}.png`);
  await page.setViewportSize(viewport === 'desktop' ? DESKTOP : MOBILE);
  const res = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await dismissOverlays(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: file, fullPage: true });
  return { route, viewport, status: res?.status() ?? 0, file };
}

test.describe('Visual sweep — marketing surface', () => {
  test('capture marketing pages', async ({ page }) => {
    test.setTimeout(420_000);
    const results: Array<Awaited<ReturnType<typeof snap>>> = [];
    for (const route of MARKETING) {
      for (const vp of ['desktop', 'mobile'] as const) {
        try {
          results.push(await snap(page, route, vp));
        } catch (err) {
          results.push({ route, viewport: vp, status: -1, file: String(err) });
        }
      }
    }
    fs.writeFileSync(
      path.join(OUT, 'marketing-manifest.json'),
      JSON.stringify(results, null, 2),
    );
    console.log(`[visual-sweep] marketing: ${results.length} shots`);
  });
});

test.describe('Visual sweep — authed app', () => {
  test('login + capture app pages', async ({ page }) => {
    test.setTimeout(600_000);
    let creds: { email: string; password: string };
    try {
      creds = await getTestCredentials();
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth unavailable',
      );
      throw error;
    }

    await page.setViewportSize(DESKTOP);
    await page.goto('/auth/signin');
    await page.evaluate(() => localStorage.setItem('e2e_test_mode', 'true'));
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 25_000 });
    await dismissOverlays(page);

    const results: Array<Awaited<ReturnType<typeof snap>>> = [];
    for (const route of AUTHED) {
      for (const vp of ['desktop', 'mobile'] as const) {
        try {
          results.push(await snap(page, route, vp));
        } catch (err) {
          results.push({ route, viewport: vp, status: -1, file: String(err) });
        }
      }
    }
    fs.writeFileSync(
      path.join(OUT, 'app-manifest.json'),
      JSON.stringify(results, null, 2),
    );
    console.log(`[visual-sweep] app: ${results.length} shots`);
    expect(results.filter((r) => r.status >= 400).map((r) => r.route)).toEqual([]);
  });
});
