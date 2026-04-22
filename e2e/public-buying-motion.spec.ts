import { expect, test, type Page } from '@playwright/test';

// `self-serve` is allowed in copy — the pricing page legitimately uses it
// as a disclosure ("Enterprise contracts closed via Stripe Invoicing, not
// self-serve checkout"). What we forbid is free-trial funnel language.
const FORBIDDEN_PUBLIC_COPY =
  /Start Free Trial|14-day free trial|14-day trial|14 day trial|no credit card required/i;

async function expectInfrastructureBuyingMotion(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toContainText(FORBIDDEN_PUBLIC_COPY);
}

test.describe('Public buying motion', () => {
  test('homepage uses compliance-plan and demo CTAs', async ({ page }) => {
    await expectInfrastructureBuyingMotion(page, '/');
    const primary = page.getByRole('link', { name: /Get Compliance Plan/i }).first();
    const secondary = page.getByRole('link', { name: /Book Demo|See Demo/i }).first();
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAttribute('href', /\/contact\?type=compliance-plan/);
    await expect(secondary).toBeVisible();
    await expect(secondary).toHaveAttribute('href', /\/contact\?type=demo/);
  });

  test('pricing leads with compliance plan, self-serve foundation, and enterprise demo paths', async ({ page }) => {
    await expectInfrastructureBuyingMotion(page, '/pricing');

    // Growth: sales-led through Compliance Plan intake.
    await expect(page.getByTestId('pricing-growth-cta')).toHaveText(/Get Compliance Plan/i);
    await expect(page.getByTestId('pricing-growth-cta')).toHaveAttribute(
      'href',
      /\/contact\?type=compliance-plan/,
    );

    // Foundation: public self-serve via /auth/signup handshake that sets the
    // checkout-intent cookie and auto-redirects into Stripe Checkout after
    // org bootstrap.
    await expect(page.getByTestId('pricing-foundation-cta')).toHaveText(/Start Assessment/i);
    await expect(page.getByTestId('pricing-foundation-cta')).toHaveAttribute(
      'href',
      /\/auth\/signup\?plan=basic&intent=checkout&source=pricing/,
    );

    // Enterprise: procurement-led, no direct checkout.
    await expect(page.getByTestId('pricing-enterprise-cta')).toHaveText(/Book Demo/i);
    await expect(page.getByTestId('pricing-enterprise-cta')).toHaveAttribute(
      'href',
      /\/contact\?type=enterprise/,
    );
  });

  test('contact page is sales/demo led', async ({ page }) => {
    await expectInfrastructureBuyingMotion(page, '/contact');
    await expect(page.getByText(/Talk to Sales|Book Demo|Request a Demo/i).first()).toBeVisible();
  });

  test('compare page avoids trial funnel copy', async ({ page }) => {
    await expectInfrastructureBuyingMotion(page, '/compare/vanta');
    await expect(page.getByRole('link', { name: /Start Buyer Review|Get Compliance Plan/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Buyer Review/i }).first()).toHaveAttribute(
      'href',
      /\/contact\?type=procurement/,
    );
  });

  test('industry page uses compliance plan and demo motion', async ({ page }) => {
    await expectInfrastructureBuyingMotion(page, '/ndis-providers');
    await expect(page.getByRole('link', { name: /Get Compliance Plan/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /See Demo|Book Demo/i }).first()).toBeVisible();
  });

  test('header and footer CTAs route to guided contact flows', async ({ page }) => {
    await expectInfrastructureBuyingMotion(page, '/');

    const headerCta = page.locator('header').getByRole('link', { name: /Get Compliance Plan/i });
    await expect(headerCta).toHaveAttribute('href', /\/contact\?type=compliance-plan/);

    const footerCta = page.locator('footer').getByRole('link', { name: /Get Compliance Plan/i });
    await expect(footerCta).toHaveAttribute('href', /\/contact\?type=compliance-plan/);
    const footerSales = page.locator('footer').getByRole('link', { name: /Talk to Sales/i });
    await expect(footerSales).toHaveAttribute('href', /\/contact\?type=sales/);
  });

  test('mobile nav CTAs avoid signup and route to sales/compliance plan', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expectInfrastructureBuyingMotion(page, '/');
    await page.getByRole('button', { name: /Open menu/i }).click();

    const mobilePrimary = page.getByRole('dialog', { name: /Navigation menu/i }).getByRole('link', {
      name: /Get Compliance Plan/i,
    });
    await expect(mobilePrimary).toHaveAttribute('href', /\/contact\?type=compliance-plan/);

    const mobileSales = page.getByRole('dialog', { name: /Navigation menu/i }).getByRole('link', {
      name: /Talk to Sales/i,
    });
    await expect(mobileSales).toHaveAttribute('href', /\/contact\?type=sales/);
  });

  test('security and trust routes use review/packet CTAs', async ({ page }) => {
    await expectInfrastructureBuyingMotion(page, '/security');
    await expect(page.getByRole('link', { name: /Book Security Review/i }).first()).toHaveAttribute(
      'href',
      /\/contact\?type=security-review/,
    );

    await expectInfrastructureBuyingMotion(page, '/trust');
    await expect(page.getByRole('link', { name: /Download Trust Packet/i }).first()).toHaveAttribute(
      'href',
      /\/trust\/packet/,
    );
  });
});
