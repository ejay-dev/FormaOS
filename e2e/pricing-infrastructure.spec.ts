import { expect, test, type Page } from '@playwright/test';

async function expectNoFreeTrialLanguage(page: Page) {
  await expect(page.getByText(/Start Free Trial/i)).toHaveCount(0);
  await expect(page.getByText(/14-day free trial/i)).toHaveCount(0);
}

test.describe('Infrastructure pricing and proof pages', () => {
  test('pricing page presents risk-first pricing and working CTAs', async ({ page }) => {
    const response = await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByRole('heading', { name: /Compliance that enforces itself/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Foundation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Growth' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
    await expect(page.getByText('$297')).toBeVisible();
    await expect(page.getByText('From $1,800')).toBeVisible();
    await expect(page.getByText('Custom', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Manual tracking/i)).toBeVisible();
    await expect(page.getByText(/Automated enforcement/i)).toBeVisible();
    await expect(page.getByText(/One failed audit can cost more than a year of FormaOS/i)).toBeVisible();
    await expectNoFreeTrialLanguage(page);

    const ctaExpectations = [
      ['pricing-foundation-cta', /\/contact\?type=assessment/],
      ['pricing-growth-cta', /\/contact\?type=compliance-plan/],
      ['pricing-enterprise-cta', /\/contact\?type=enterprise/],
    ] as const;

    for (const [testId, hrefPattern] of ctaExpectations) {
      const href = await page.getByTestId(testId).getAttribute('href');
      expect(href).toMatch(hrefPattern);
    }

    const heroHref = await page
      .getByRole('link', { name: /Get Compliance Plan/i })
      .first()
      .getAttribute('href');
    expect(heroHref).toMatch(/\/contact\?type=compliance-plan/);

    await page.getByRole('link', { name: /View Pricing/i }).first().click();
    await expect(page).toHaveURL(/#pricing-table$/);
  });

  test('homepage exposes trust, ROI, product, prevention, and proof layers', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByText(/Designed for NDIS, AHPRA, ISO, and SOC 2/i).first()).toBeVisible();
    await expect(page.getByText(/Compliance should be priced against failure/i)).toBeVisible();
    await expect(page.getByText(/See the operating system behind the promise/i)).toBeVisible();
    await expect(page.getByText(/Stop relying on memory for work that needs proof/i).first()).toBeVisible();
    await expect(page.getByText(/Every compliance action is checked before it becomes evidence/i)).toBeVisible();
    await expect(page.getByText('Representative proof pack', { exact: true })).toBeVisible();
    await expectNoFreeTrialLanguage(page);

    const caseStudyHref = await page
      .getByRole('link', { name: /View proof packs/i })
      .getAttribute('href');
    expect(caseStudyHref).toBe('/case-studies');
  });

  test('case studies page loads the proof pack route', async ({ page }) => {
    const response = await page.goto('/case-studies', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByRole('heading', { name: /Representative proof packs for regulated teams/i })).toBeVisible();
    await expect(page.getByText('Representative proof pack', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Workflow trail' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Build a Proof Walkthrough/i })).toHaveAttribute(
      'href',
      /\/contact\?type=case-study/,
    );
    await expectNoFreeTrialLanguage(page);
  });
});
