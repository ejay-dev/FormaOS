import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const USER_TYPES = ['logged-out', 'trial', 'existing', 'employer', 'employee'];

test.describe('CTA click sweep', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const userType of USER_TYPES) {
    test(
      `${userType} - click visible CTAs (sample)`,
      async ({ browser }) => {
        const context = await browser.newContext();
        // inject a mock user state for non-logged-out types to avoid completing real auth flows
        if (userType !== 'logged-out') {
          await context.addInitScript((role: string) => {
            try {
              localStorage.setItem(
                '__TEST_MOCK_USER__',
                JSON.stringify({ role }),
              );
            } catch (e) {
              // noop
            }
          }, userType);
        }

        // Intercept navigation to external origins and stub them so tests don't leave the site
        const page = await context.newPage();
        await page.route('**/*', async (route) => {
          const req = route.request();
          const url = req.url();
          try {
            const dest = new URL(url);
            const baseOrigin = new URL(BASE).origin;
            if (dest.origin !== baseOrigin && req.isNavigationRequest()) {
              await route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: `<html><body><h1>External stub for ${dest.origin}</h1></body></html>`,
              });
              return;
            }
          } catch (e) {
            // if URL parsing fails, continue
          }
          await route.continue();
        });

        await page.goto(BASE, { waitUntil: 'networkidle' });

        const locator = page.locator('a[href], button, [role="button"]');
        const total = Math.min(50, await locator.count());

        const seenUrls: Record<string, number> = {};

        for (let i = 0; i < total; i++) {
          const el = locator.nth(i);
          if (!(await el.isVisible())) continue;

          const text =
            (await el.innerText()).trim().slice(0, 120) ||
            (await el.getAttribute('aria-label')) ||
            `index-${i}`;
          const href = await el.getAttribute('href');

          // Click and wait briefly for navigation or network idle
          try {
            const clickPromise = el.click({ force: true }).catch(() => null);
            const nav = await Promise.race([
              page
                .waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 })
                .catch(() => null),
              clickPromise,
              new Promise((res) => setTimeout(res, 1500)),
            ]);

            // record current url and check for loops/blank pages
            const url = page.url();
            seenUrls[url] = (seenUrls[url] || 0) + 1;

            // fail if redirect loop (same url seen >5 times)
            expect(seenUrls[url]).toBeLessThanOrEqual(5);

            // basic checks: page body should not be empty or contain server error phrases
            const body = await page.content();
            expect(body.length).toBeGreaterThan(200);
            expect(body.toLowerCase()).not.toContain('internal server error');
            expect(body.toLowerCase()).not.toContain('error');
          } catch (err) {
            // capture failure with context
            throw new Error(
              `CTA click failed for userType=${userType} index=${i} text="${text}" href=${href} — ${String(err)}`,
            );
          }

          // navigate back to base before next click to keep environment consistent
          await page.goto(BASE, { waitUntil: 'networkidle' });
        }

        await context.close();
      },
    );
  }
});
