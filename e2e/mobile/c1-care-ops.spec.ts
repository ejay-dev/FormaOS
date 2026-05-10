/**
 * C1 — care-operations route audit at iPhone 14 viewport.
 *
 * Asserts:
 *   - No horizontal page scroll (`document.body.scrollWidth <= window.innerWidth`)
 *   - OnboardingGuide popup is hidden on phones (the inline OnboardingStrip
 *     covers the same nudge without overlapping the page hero)
 *
 * Captures iPhone 14 baseline JPEGs into e2e/screenshots/mobile/c1-* so
 * the next reviewer can spot visual regressions. iPhone SE coverage is
 * in c1-care-ops-iphone-se.spec.ts (Playwright requires the device
 * `test.use({...})` at top level, hence the split).
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

const ROUTES = [
  '/app/incidents',
  '/app/incidents/new',
  '/app/care-plans',
  '/app/participants',
  '/app/visits',
  '/app/progress-notes',
];

test.describe('C1 — iPhone 14 (390×844)', () => {
  test.beforeEach(async ({ context }) => {
    const session = loadCachedSession();
    if (!session) {
      test.skip(true, 'no cached e2e session — skipping authed C1 audit');
      return;
    }
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
    await setPlaywrightSession(context, session, baseUrl);
  });

  for (const route of ROUTES) {
    test(`${route} — no horizontal scroll + screenshot baseline`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page
        .waitForLoadState('networkidle', { timeout: 5000 })
        .catch(() => {});

      const probe = await page.evaluate(() => ({
        viewportW: window.innerWidth,
        bodyScrollW: document.body.scrollWidth,
      }));
      expect
        .soft(
          probe.bodyScrollW,
          `body scroll ${probe.bodyScrollW}px > viewport ${probe.viewportW}px`,
        )
        .toBeLessThanOrEqual(probe.viewportW + 1);

      const guide = page.locator('[data-testid="onboarding-guide"]').first();
      if ((await guide.count()) > 0) {
        await expect
          .soft(guide, 'OnboardingGuide popup must be hidden on mobile')
          .toBeHidden();
      }

      const slug = route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({
        path: `e2e/screenshots/mobile/c1-${slug}.jpg`,
        type: 'jpeg',
        quality: 60,
        fullPage: true,
      });
    });
  }
});
