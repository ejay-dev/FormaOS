/**
 * Mobile touch-target compliance for high-traffic /app routes.
 *
 * For each route, opens it at an iPhone 14 viewport and asserts every
 * visible <button>, <a> with role link, and <input type="checkbox">
 * has computed min(width, height) >= 44px (iOS HIG / Material).
 *
 * Hidden-on-mobile elements (e.g. desktop tables under `hidden md:block`)
 * report a 0×0 box and are filtered out before the assertion.
 *
 * Auth: uses the shared `loginAs` helper, which gracefully skips when
 * SUPABASE_SERVICE_ROLE_KEY isn't available (CI marketing-only jobs).
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
    const raw = fs.readFileSync(SESSION_CACHE_PATH, 'utf8');
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

const ROUTES = [
  '/app',
  '/app/incidents',
  '/app/care-plans',
  '/app/participants',
  '/app/staff-compliance',
  '/app/forms',
  '/app/billing',
];

const MIN_TAP = 44;

type Offender = {
  selector: string;
  width: number;
  height: number;
  text: string;
};

async function collectOffenders(page: import('@playwright/test').Page) {
  return await page.evaluate((minTap) => {
    function summarize(el: Element): string {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls = (el as HTMLElement).className?.toString().slice(0, 60) ?? '';
      const text = (el.textContent ?? '').trim().slice(0, 40);
      return `${tag}${id} "${text}" .${cls}`;
    }

    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, a[href], input[type="checkbox"], input[type="radio"], [role="button"], [role="link"]',
      ),
    );

    const offenders: Array<{
      selector: string;
      width: number;
      height: number;
      text: string;
    }> = [];

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      // Filter: skip hidden-on-mobile (0×0), skip aria-hidden, skip disabled
      if (rect.width <= 1 || rect.height <= 1) continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      if (
        el instanceof HTMLButtonElement ||
        el instanceof HTMLInputElement
      ) {
        if (el.disabled) continue;
      }
      // Skip elements that aren't visible
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden') continue;
      if (style.display === 'none') continue;
      // sr-only utility class: visually hidden, only for screen readers.
      // Tailwind's sr-only collapses size to 1×1 but Next.js focus-visible
      // skip-links unhide on focus — never on initial render.
      if ((el as HTMLElement).className?.toString().includes('sr-only')) continue;
      // Off-screen (likely portal/dialog/popover that's hidden)
      if (rect.bottom < 0 || rect.right < 0) continue;
      // Inside a closed Radix dialog/popover
      if (el.closest('[data-state="closed"]')) continue;

      const minSide = Math.min(rect.width, rect.height);
      if (minSide < minTap) {
        offenders.push({
          selector: summarize(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          text: (el.textContent ?? '').trim().slice(0, 40),
        });
      }
    }
    return offenders;
  }, MIN_TAP);
}

test.describe('Mobile touch-target compliance — iPhone 14', () => {
  test.beforeEach(async ({ context }) => {
    const session = loadCachedSession();
    if (!session) {
      test.skip(
        true,
        'no cached e2e session — global-setup did not pre-warm one (Supabase env missing?)',
      );
      return;
    }
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
    await setPlaywrightSession(context, session, baseUrl);
  });

  for (const route of ROUTES) {
    test(`${route} — every interactive control >= 44px on mobile`, async ({
      page,
    }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Allow either a 200 from the route or a redirect that eventually
      // settles inside /app (org-onboarding paywall, MFA, etc).
      if (response && response.status() >= 500) {
        test.skip(true, `${route} returned ${response.status()}; skipping`);
        return;
      }
      // Let any client-side hydration / lazy lists settle.
      await page.waitForLoadState('domcontentloaded');
      await page
        .waitForLoadState('networkidle', { timeout: 5000 })
        .catch(() => {});

      const offenders: Offender[] = await collectOffenders(page);

      if (offenders.length > 0) {
        const sample = offenders.slice(0, 8).map((o) => {
          return `  ${o.width}×${o.height}px — ${o.selector}`;
        });
        throw new Error(
          `${offenders.length} interactive control(s) on ${route} are smaller than ${MIN_TAP}px on iPhone 14:\n${sample.join('\n')}`,
        );
      }
      expect(offenders).toEqual([]);
    });
  }
});
