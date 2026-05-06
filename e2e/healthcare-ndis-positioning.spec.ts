/**
 * Healthcare & NDIS positioning smoke tests.
 *
 * The detailed copy assertions in the original version of this spec predated
 * the UseCasePageTemplate refresh — the per-section "Patient Management
 * System" / "Progress Notes & Clinical Documentation" / "Participant
 * Management" narrative structure no longer exists on the redesigned pages.
 * This file now checks the promises that still hold: each page loads, the
 * industry badge + hero match current copy, framework language (AHPRA /
 * NDIS Practice Standards) is present, CTAs route through the public buying
 * motion, and the homepage healthcare/NDIS strip still surfaces the three
 * differentiator bullets marketing relies on.
 */
import { test, expect } from '@playwright/test';

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  'http://localhost:3000';

test.describe('Healthcare & NDIS positioning', () => {
  test.describe.configure({ timeout: 60_000 });

  test('Healthcare use-case page loads with current hero copy', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('h1').first()).toContainText(/healthcare/i);
    await expect(page.getByText('Healthcare Compliance').first()).toBeVisible();
    await expect(page.getByText(/AHPRA/i).first()).toBeVisible();
  });

  test('Healthcare use-case page surfaces mapped framework coverage', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText(/NSQHS/i).first()).toBeVisible();
    await expect(page.getByText(/Privacy Act/i).first()).toBeVisible();
  });

  test('Healthcare page CTA routes to compliance plan contact flow', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'domcontentloaded',
    });

    const ctaButton = page
      .getByRole('link', { name: /Get Compliance Plan|Book Demo/i })
      .first();
    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('/contact');
  });

  test('NDIS use-case page loads with current hero copy', async ({ page }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('h1').first()).toContainText(/NDIS|aged care/i);
    await expect(page.getByText('NDIS & Aged Care').first()).toBeVisible();
  });

  test('NDIS use-case page surfaces NDIS Practice Standards coverage', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page.getByText(/NDIS Practice Standards/i).first(),
    ).toBeVisible();
  });

  test('NDIS page CTA routes to compliance plan contact flow', async ({
    page,
  }) => {
    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'domcontentloaded',
    });

    const ctaButton = page
      .getByRole('link', { name: /Get Compliance Plan|Book Demo/i })
      .first();
    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('/contact');
  });

  // Below-fold homepage sections (Industries, Outcome Proof) render through
  // DeferredSection + dynamic(ssr:false), so they only mount once an
  // IntersectionObserver fires near them. Scroll through the page first to
  // trigger every observer, then hunt for the copy.
  const revealHomeSections = async (page: import('@playwright/test').Page) => {
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 400));
    });
  };

  test('Home Industries strip surfaces Healthcare solution with current copy', async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await revealHomeSections(page);
    const hit = page
      .getByText(/Patient safety evidence and clinical governance/i)
      .first();
    await expect(hit).toBeVisible({ timeout: 20_000 });
  });

  test('Home Industries strip surfaces NDIS Practice Standards subtitle', async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await revealHomeSections(page);
    const hit = page
      .getByText(/NDIS Practice Standards .* Quality & Safeguards Commission/i)
      .first();
    await expect(hit).toBeVisible({ timeout: 20_000 });
  });

  test('Healthcare and NDIS CTAs share the compliance-infrastructure funnel', async ({
    page,
  }) => {
    const ctaNameRegex = /Get Compliance Plan|Book Demo/i;

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const homeCtaHref = await page
      .getByRole('link', { name: ctaNameRegex })
      .first()
      .getAttribute('href');

    await page.goto(`${BASE}/use-cases/healthcare`, {
      waitUntil: 'domcontentloaded',
    });
    const healthcareCtaHref = await page
      .getByRole('link', { name: ctaNameRegex })
      .first()
      .getAttribute('href');

    await page.goto(`${BASE}/use-cases/ndis-aged-care`, {
      waitUntil: 'domcontentloaded',
    });
    const ndisCtaHref = await page
      .getByRole('link', { name: ctaNameRegex })
      .first()
      .getAttribute('href');

    expect(homeCtaHref).toContain('/contact');
    expect(healthcareCtaHref).toContain('/contact');
    expect(ndisCtaHref).toContain('/contact');
  });
});
