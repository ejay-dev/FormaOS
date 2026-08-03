/**
 * C2 — compliance-operations route audit at iPhone 14.
 *
 * Asserts: no horizontal page scroll on each route at 390×844, captures
 * iPhone 14 baseline JPEGs into e2e/screenshots/mobile/c2-*. iPhone SE
 * coverage lives in c2-compliance-ops-iphone-se.spec.ts.
 *
 * The OnboardingGuide hide-on-mobile guarantee is owned by the C1 spec
 * (e2e/mobile/c1-care-ops.spec.ts) so this PR can land in any order.
 */
import fs from 'node:fs';
import type { Session } from '@supabase/supabase-js';
import { devices, expect, test } from '@playwright/test';
import {
  E2E_SESSION_CACHE_PATH,
  setPlaywrightSession,
} from '../helpers/test-auth';

test.use({ ...devices['iPhone 14'] });

function loadCachedSession(): Session | null {
  try {
    return JSON.parse(
      fs.readFileSync(E2E_SESSION_CACHE_PATH, 'utf8'),
    ) as Session;
  } catch {
    return null;
  }
}

const ROUTES = [
  '/app/compliance',
  '/app/policies',
  '/app/staff-compliance',
  '/app/registers',
  '/app/audit-trail',
];

test.describe('C2 — iPhone 14 (390×844)', () => {
  test.beforeEach(async ({ context }) => {
    const session = loadCachedSession();
    if (!session) {
      test.skip(true, 'no cached e2e session — skipping authed C2 audit');
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

      const slug = route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({
        path: `e2e/screenshots/mobile/c2-${slug}.jpg`,
        type: 'jpeg',
        quality: 60,
        fullPage: true,
      });
    });
  }
});
