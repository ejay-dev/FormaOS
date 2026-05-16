import { expect, test, type Page } from '@playwright/test';

async function expectNoFreeTrialLanguage(page: Page) {
  await expect(page.getByText(/Start Free Trial/i)).toHaveCount(0);
  await expect(page.getByText(/14-day free trial/i)).toHaveCount(0);
}

test.describe('Infrastructure pricing and proof pages', () => {
  test('pricing page presents risk-first pricing and working CTAs', async ({
    page,
  }) => {
    const response = await page.goto('/pricing', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByRole('heading', {
        name: /Compliance,?\s+priced like infrastructure/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Foundation', exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Growth', exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Scale', exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Enterprise', exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText('$297', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('$797', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('$1,800', { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText('Custom', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page
        .getByText('Evidence generated as work happens', { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByText(/One failed audit costs more than/i).first(),
    ).toBeVisible();
    await expectNoFreeTrialLanguage(page);

    // Foundation is public self-serve via the /auth/signup handshake that
    // sets a checkout-intent cookie and auto-redirects into Stripe Checkout
    // after email verification + org bootstrap.
    const ctaExpectations = [
      [
        'pricing-foundation-cta',
        /\/auth\/signup\?plan=basic&intent=checkout&source=pricing/,
      ],
      ['pricing-growth-cta', /\/auth\/signup\?plan=pro/],
      ['pricing-enterprise-cta', /\/contact\?type=enterprise/],
    ] as const;

    for (const [testId, hrefPattern] of ctaExpectations) {
      const href = await page.getByTestId(testId).getAttribute('href');
      expect(href).toMatch(hrefPattern);
    }

    // Editorial hero uses "Talk to procurement" (contact link) and "Read the
    // four plans" (in-page anchor to #pricing-table) — the SaaS-template
    // "Get Compliance Plan" / "View Pricing" labels were retired with the
    // editorial redesign.
    const heroHref = await page
      .getByRole('link', { name: /Talk to procurement/i })
      .first()
      .getAttribute('href');
    expect(heroHref).toMatch(/\/contact\?type=compliance-plan/);

    await page
      .getByRole('link', { name: /Read the four plans/i })
      .first()
      .click();
    await expect(page).toHaveURL(/#pricing-table$/);
  });

  test('homepage exposes trust and core operating-system proof', async ({
    page,
  }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByText(/Designed for NDIS, AHPRA, ISO, and SOC 2/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Controls run as workflows, not as documents/i),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /From obligation to enforced evidence chain/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/Compliance should be priced against failure/i),
    ).toHaveCount(0);
    await expect(
      page.getByText(/See the operating system behind the promise/i),
    ).toHaveCount(0);
    await expect(
      page.getByText(/Stop relying on memory for work that needs proof/i),
    ).toHaveCount(0);
    await expectNoFreeTrialLanguage(page);

    const productHref = await page
      .getByRole('link', { name: /See how it works/i })
      .getAttribute('href');
    expect(productHref).toBe('/product');
  });

  test('case studies page loads the proof pack route', async ({ page }) => {
    const response = await page.goto('/case-studies', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByRole('heading', {
        name: /Representative proof packs for regulated teams/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Representative proof pack', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Workflow trail' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Build a Proof Walkthrough/i }),
    ).toHaveAttribute('href', /\/contact\?type=case-study/);
    await expectNoFreeTrialLanguage(page);
  });
});
