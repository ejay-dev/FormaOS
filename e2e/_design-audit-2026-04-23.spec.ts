import { test, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe.configure({ mode: 'serial' });

const OUTPUT_DIR = path.resolve(
  __dirname,
  '..',
  'artifacts',
  'design-audit-2026-04-23',
);

const ROUTES: { slug: string; path: string }[] = [
  { slug: 'home', path: '/' },
  { slug: 'pricing', path: '/pricing' },
  { slug: 'contact-default', path: '/contact' },
  {
    slug: 'contact-compliance-plan',
    path: '/contact?type=compliance-plan&plan=growth&source=pricing',
  },
  {
    slug: 'contact-enterprise',
    path: '/contact?type=enterprise&plan=enterprise&source=pricing',
  },
  { slug: 'product', path: '/product' },
  { slug: 'features', path: '/features' },
  { slug: 'ndis-providers', path: '/ndis-providers' },
  { slug: 'healthcare-compliance', path: '/healthcare-compliance' },
  {
    slug: 'financial-services-compliance',
    path: '/financial-services-compliance',
  },
  { slug: 'evaluate', path: '/evaluate' },
  { slug: 'compare-drata', path: '/compare/drata' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

async function captureScrollingPage(
  page: Page,
  slug: string,
  vpName: string,
  vpHeight: number,
) {
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.waitForLoadState('networkidle', { timeout: 6000 });
  } catch {
    /* ignore */
  }
  // Accept cookie banner if present, so it doesn't obscure hero on every shot.
  try {
    await page
      .locator('button', { hasText: /Accept all/i })
      .first()
      .click({ timeout: 1500 });
    await page.waitForTimeout(200);
  } catch {
    /* not present */
  }

  const totalHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const step = Math.round(vpHeight * 0.85);
  const stops: number[] = [];
  for (let y = 0; y < totalHeight; y += step) stops.push(y);
  if (stops[stops.length - 1] < totalHeight - vpHeight) {
    stops.push(Math.max(0, totalHeight - vpHeight));
  }

  for (let i = 0; i < stops.length; i += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), stops[i]);
    await page.waitForTimeout(500); // let ScrollReveal settle
    const file = path.join(
      OUTPUT_DIR,
      `${slug}--${vpName}--${String(i).padStart(2, '0')}.png`,
    );
    await page.screenshot({ path: file, fullPage: false });
  }
}

test.beforeAll(() => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  // Clear stale shots so we don't mix old fullPage shots with new sequenced ones
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    try {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(OUTPUT_DIR, f));
    } catch {
      /* already gone */
    }
  }
});

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`audit ${route.slug} (${vp.name})`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      // Retry navigation once to handle cold-start ERR_ABORTED flakes
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await page.goto(route.path, {
            waitUntil: 'domcontentloaded',
            timeout: 60_000,
          });
          break;
        } catch (err) {
          if (attempt === 3) throw err;
          await page.waitForTimeout(2000 * attempt);
        }
      }
      await captureScrollingPage(page, route.slug, vp.name, vp.height);
    });
  }
}
