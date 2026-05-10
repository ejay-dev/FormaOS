/**
 * Group E — tablet-aware dashboard widget audit.
 *
 * Captures /app and /app/executive at iPad portrait (768×1024) and a
 * narrow-laptop / iPad-Pro width (1024×1366). Asserts:
 *   - No horizontal page scroll
 *   - No widget squeezed below the 280px floor in the executive
 *     KPI / Command Center grids (the brief's acceptance criterion)
 *
 * The 1024-width audit is what surfaced the "labels truncated to
 * CRITICA…" cramming in the Command Center; this spec pins the 2-col
 * tablet layout in place so we don't regress to the 4-col jam.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Session } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { setPlaywrightSession } from '../helpers/test-auth';

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

const VIEWPORTS = [
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 1366 },
];

const ROUTES = ['/app', '/app/executive'];

const MIN_WIDGET_PX = 280;

for (const vp of VIEWPORTS) {
  test.describe(`E — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test.beforeEach(async ({ context }) => {
      const session = loadCachedSession();
      if (!session) {
        test.skip(true, 'no cached e2e session — skipping authed tablet audit');
        return;
      }
      const baseUrl =
        process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
      await setPlaywrightSession(context, session, baseUrl);
    });

    for (const route of ROUTES) {
      test(`${route} — no overflow + executive widgets >= ${MIN_WIDGET_PX}px`, async ({
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

        // On /app/executive, assert KPI cards + Command Center cells
        // each render at >= 280px wide. (Heading siblings inside those
        // grids are queried via their distinctive text content so we
        // catch the actual cards, not the section wrapper.)
        if (route === '/app/executive') {
          const widths = await page.evaluate(() => {
            const labels = [
              'OVERALL SCORE',
              'FRAMEWORK COVERAGE',
              'AUTOMATION',
              'CRITICAL GAPS',
              'CRITICAL CONTROL GAPS',
              'DEADLINE PRESSURE',
              'MISSING CONTROLS',
              'AUTOMATION RELIABILITY',
            ];
            const out: Array<{ label: string; w: number }> = [];
            for (const label of labels) {
              const node = Array.from(document.querySelectorAll('*')).find(
                (el) => el.textContent?.trim().startsWith(label),
              );
              if (!node) continue;
              const card = node.closest('div');
              if (!card) continue;
              out.push({
                label,
                w: Math.round(card.getBoundingClientRect().width),
              });
            }
            return out;
          });
          for (const { label, w } of widths) {
            expect
              .soft(
                w,
                `${label} card is ${w}px wide at ${vp.width}px viewport (need >= ${MIN_WIDGET_PX})`,
              )
              .toBeGreaterThanOrEqual(MIN_WIDGET_PX);
          }
        }

        const slug = route.replace(/\//g, '_').replace(/^_/, '');
        await page.screenshot({
          path: `e2e/screenshots/mobile/e-${vp.name}-${slug}.jpg`,
          type: 'jpeg',
          quality: 60,
          fullPage: true,
        });
      });
    }
  });
}
