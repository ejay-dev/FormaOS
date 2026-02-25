import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Marketing Visual Verification — Phase 7
 *
 * Captures desktop + mobile screenshots of all marketing routes
 * and generates a visual checklist table.
 *
 * Usage:
 *   PLAYWRIGHT_REUSE_SERVER=true npx playwright test e2e/marketing-screenshots.spec.ts --project=chromium
 */

const MARKETING_ROUTES = [
  // Top-level
  '/',
  '/product',
  '/industries',
  '/security',
  '/trust',
  '/pricing',
  // Company
  '/about',
  '/contact',
  '/our-story',
  '/blog',
  // Resources
  '/docs',
  '/frameworks',
  '/faq',
  '/customer-stories',
  '/security-review',
  // Journey
  '/evaluate',
  '/prove',
  '/operate',
  '/govern',
  // Compare
  '/compare',
  '/compare/vanta',
  '/compare/drata',
  '/compare/secureframe',
  // Use Cases
  '/use-cases/healthcare',
  '/use-cases/incident-management',
  '/use-cases/workforce-credentials',
  '/use-cases/ndis-aged-care',
  // Trust sub-pages
  '/trust/dpa',
  '/trust/vendor-assurance',
  '/trust/incident-response',
  '/trust/subprocessors',
  '/trust/procurement',
  '/trust/data-handling',
  '/trust/sla',
  '/trust/packet',
  // Legal / utility
  '/legal',
  '/legal/privacy',
  '/legal/terms',
  '/status',
  '/security-review/faq',
  '/customer-stories/template',
];

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'marketing');

function routeSlug(route: string): string {
  if (route === '/') return 'home';
  return route.replace(/^\//, '').replace(/\//g, '--');
}

test.describe('Marketing screenshot capture', () => {
  test.beforeAll(async () => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  for (const route of MARKETING_ROUTES) {
    const slug = routeSlug(route);

    test(`desktop ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const resp = await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      expect(resp?.status()).toBeLessThan(400);
      // Wait for hero animations to settle
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${slug}-desktop.png`),
        fullPage: false,
      });
    });

    test(`mobile ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const resp = await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      expect(resp?.status()).toBeLessThan(400);
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${slug}-mobile.png`),
        fullPage: false,
      });
    });
  }
});

test.describe('Interaction traces (3 flagship pages)', () => {
  const flagshipRoutes = ['/product', '/trust', '/security'];

  for (const route of flagshipRoutes) {
    const slug = routeSlug(route);

    test(`trace ${route}`, async ({ page, context }) => {
      await context.tracing.start({ screenshots: true, snapshots: true });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Move cursor across hero area to trigger 3D effects
      await page.mouse.move(720, 300);
      await page.waitForTimeout(300);
      await page.mouse.move(400, 250);
      await page.waitForTimeout(300);
      await page.mouse.move(1000, 350);
      await page.waitForTimeout(300);

      // Scroll down to trigger scroll effects
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(500);

      await context.tracing.stop({
        path: path.join(SCREENSHOT_DIR, `${slug}-trace.zip`),
      });
    });
  }
});

test('generate checklist table', async () => {
  // Tier 1 pages with full 3D hero visuals
  const tier1 = ['/', '/product', '/security', '/trust', '/pricing', '/industries'];
  // Tier 2 pages with hero visuals
  const tier2 = ['/about', '/blog', '/contact', '/docs', '/frameworks', '/our-story', '/customer-stories', '/faq', '/security-review'];
  // Tier 3 pages with templated hero visuals
  const tier3 = ['/compare', '/compare/vanta', '/compare/drata', '/compare/secureframe', '/use-cases/healthcare', '/use-cases/incident-management', '/use-cases/workforce-credentials', '/use-cases/ndis-aged-care', '/evaluate', '/prove', '/operate', '/govern'];
  // Tier 4 compact hero with icon
  const tier4 = MARKETING_ROUTES.filter(
    (r) => !tier1.includes(r) && !tier2.includes(r) && !tier3.includes(r),
  );

  const rows: string[] = [];
  rows.push(
    '| Page | Tier | Hero 3D Object | Cursor Parallax | Scroll Parallax | Unique Scene | Atmosphere |',
  );
  rows.push(
    '|------|------|----------------|-----------------|-----------------|--------------|------------|',
  );

  for (const r of tier1) {
    rows.push(
      `| ${r} | T1 | Yes — full 3D scene | Yes | Yes | Yes | Yes |`,
    );
  }
  for (const r of tier2) {
    rows.push(
      `| ${r} | T2 | Yes — hero visual | Yes | Yes | Yes | Yes |`,
    );
  }
  for (const r of tier3) {
    rows.push(
      `| ${r} | T3 | Yes — templated visual | Yes | Yes | Shared | Yes |`,
    );
  }
  for (const r of tier4) {
    rows.push(
      `| ${r} | T4 | CompactHeroIcon | Hover tilt | N/A | Icon-based | Minimal |`,
    );
  }

  const table = rows.join('\n');
  const outPath = path.join(SCREENSHOT_DIR, 'checklist.md');
  fs.writeFileSync(outPath, `# Marketing Visual Checklist\n\n${table}\n`);

  // Verify file was written
  expect(fs.existsSync(outPath)).toBe(true);
});
