/**
 * Marketing-Product Alignment Smoke Tests
 * Verifies that marketing CTAs route to the three buying motions:
 *  - Foundation "Start Foundation Plan" → /auth/signup with checkout intent (self-serve)
 *  - Growth "Start Growth Plan" → /auth/signup with checkout intent (self-serve, like Foundation)
 *  - Enterprise "Book Demo" → /contact enterprise flow (Stripe Invoicing)
 */

import { test, expect } from '@playwright/test';

test.describe('Marketing CTA Alignment', () => {
  test('Homepage primary CTA routes to compliance plan contact flow', async ({
    page,
  }) => {
    await page.goto('/');

    const primaryCta = page
      .getByRole('link', { name: /Get Compliance Plan/i })
      .first();
    await expect(primaryCta).toBeVisible();
    const href = await primaryCta.getAttribute('href');
    expect(href).toContain('/contact');
    expect(href).toContain('type=compliance-plan');
  });

  test('Homepage does not expose trial-era CTAs', async ({ page }) => {
    await page.goto('/');
    const body = (await page.textContent('body')) ?? '';
    expect(body).not.toMatch(/Start Free Trial/i);
    expect(body).not.toMatch(/14[- ]day free trial/i);
    expect(body).not.toMatch(/no credit card required/i);
  });

  test('Pricing page presents three compliance tiers with correct CTAs', async ({
    page,
  }) => {
    await page.goto('/pricing');

    const foundationCta = page.getByTestId('pricing-foundation-cta');
    const growthCta = page.getByTestId('pricing-growth-cta');
    const enterpriseCta = page.getByTestId('pricing-enterprise-cta');

    await expect(foundationCta).toBeVisible();
    await expect(growthCta).toBeVisible();
    await expect(enterpriseCta).toBeVisible();

    await expect(foundationCta).toHaveText(/Start Foundation Plan/);
    await expect(growthCta).toHaveText(/Start Growth Plan/);
    await expect(enterpriseCta).toHaveText(/Book Demo/);

    const foundationHref = (await foundationCta.getAttribute('href')) ?? '';
    const growthHref = (await growthCta.getAttribute('href')) ?? '';
    const enterpriseHref = (await enterpriseCta.getAttribute('href')) ?? '';

    // Foundation is self-serve: signup with checkout intent → auto-redirect to
    // Stripe Checkout post-signup. plan=basic is the internal PlanKey.
    expect(foundationHref).toContain('/auth/signup');
    expect(foundationHref).toContain('plan=basic');
    expect(foundationHref).toContain('intent=checkout');

    // Growth is self-serve: signup with checkout intent → auto-redirect to
    // Stripe Checkout post-signup. plan=pro is the internal PlanKey.
    expect(growthHref).toContain('/auth/signup');
    expect(growthHref).toContain('plan=pro');
    expect(growthHref).toContain('intent=checkout');

    // Enterprise is procurement-led — demo + security/procurement review.
    expect(enterpriseHref).toContain('/contact?type=enterprise');
  });

  test('Pricing page does not expose trial-era CTAs', async ({ page }) => {
    await page.goto('/pricing');
    const body = (await page.textContent('body')) ?? '';
    expect(body).not.toMatch(/Start Free Trial/i);
    expect(body).not.toMatch(/14[- ]day free trial/i);
    expect(body).not.toMatch(/no credit card required/i);
    expect(body).toContain('Foundation');
    expect(body).toContain('Growth');
    expect(body).toContain('Enterprise');
  });

  test('Contact form exists and is accessible', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Header CTA routes to compliance plan', async ({ page }, testInfo) => {
    test.skip(
      /Mobile/i.test(testInfo.project.name),
      'Header CTA lives behind the hamburger on mobile — covered by the Mobile Alignment suite.',
    );
    await page.goto('/');
    const headerCta = page
      .locator('header')
      .getByRole('link', { name: /Get Compliance Plan/i });
    await expect(headerCta.first()).toBeVisible();
    const href = await headerCta.first().getAttribute('href');
    expect(href).toContain('/contact?type=compliance-plan');
  });
});

test.describe('Mobile Alignment', () => {
  test('Homepage is mobile-responsive and surfaces compliance CTA', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const body = (await page.textContent('body')) ?? '';
    expect(body).toContain('Get Compliance Plan');
  });

  test('Pricing page is mobile-responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
  });
});
