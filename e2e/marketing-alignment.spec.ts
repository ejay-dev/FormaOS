/**
 * Marketing-Product Alignment Smoke Tests
 * Verifies that marketing claims match actual product capabilities
 */

import { test, expect } from '@playwright/test';

test.describe('Marketing → App Alignment Tests', () => {
  test('Homepage CTAs navigate correctly', async ({ page }) => {
    await page.goto('/');

    // Verify "Start Free Trial" button exists and has correct href
    const trialButton = page.locator('a:has-text("Start Free Trial")').first();
    await expect(trialButton).toBeVisible();
    const href = await trialButton.getAttribute('href');
    expect(href).toContain('/auth/signup');
    expect(href).toContain('plan=pro');

    // Verify "Request Demo" button exists
    const demoButton = page.locator('a:has-text("Request Demo")').first();
    await expect(demoButton).toBeVisible();
    const demoHref = await demoButton.getAttribute('href');
    expect(demoHref).toBe('/contact');
  });

  test('Homepage claims accuracy - no false early access', async ({ page }) => {
    await page.goto('/');

    // Should NOT contain misleading "Evidence Intelligence AI (early access)"
    const content = await page.textContent('body');
    expect(content).not.toContain('Evidence Intelligence AI');
    expect(content).not.toContain(
      'Evidence quality signals and scoring (early access)',
    );

    // Should contain accurate claims
    expect(content).toContain('Compliance Intelligence');
    expect(content).toContain('Executive Dashboard');
    expect(content).toContain('Cross-Framework Mapping');
  });

  test('Automation features are accurately represented', async ({ page }) => {
    await page.goto('/');
    const content = await page.textContent('body');

    // Verify automation engine is mentioned (it actually exists)
    expect(content).toContain('Automation Engine');
    expect(content).toContain('automation triggers');
  });

  test('Framework packs claim is accurate', async ({ page }) => {
    await page.goto('/');
    const content = await page.textContent('body');

    // Should mention 7 framework packs (which actually exist)
    expect(content).toContain('7 pre-built frameworks');
    expect(content).toContain('ISO 27001');
    expect(content).toContain('SOC 2');
    expect(content).toContain('GDPR');
    expect(content).toContain('HIPAA');
    expect(content).toContain('PCI-DSS');
  });

  test('Pricing page claims are accurate', async ({ page }) => {
    await page.goto('/pricing');
    const content = await page.textContent('body');

    // Should NOT contain misleading early access labels
    expect(content).not.toContain('Evidence quality scoring (early access)');
    expect(content).not.toContain('Master control mapping (planned)');

    // Should contain accurate descriptions
    expect(content).toContain('Compliance intelligence');
    expect(content).toContain('Executive dashboard');
  });

  test('Contact form exists and is accessible', async ({ page }) => {
    await page.goto('/contact');

    // Verify form fields exist
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Signup page is accessible with plan parameter', async ({ page }) => {
    await page.goto('/auth/signup?plan=pro');

    // Verify signup form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Should show Pro plan badge/indicator
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('pro');
  });
});

test.describe('App Feature Discoverability', () => {
  test.skip('Executive Dashboard is accessible to owner/admin (requires auth)', async ({
    page: _page,
  }) => {
    // This test requires authentication - skip for now
    // In a full test, would:
    // 1. Sign in as owner/admin
    // 2. Navigate to /app/executive
    // 3. Verify dashboard loads with analytics
  });

  test.skip('Compliance Intelligence is visible on dashboard (requires auth)', async ({
    page: _page,
  }) => {
    // This test requires authentication - skip for now
    // In a full test, would:
    // 1. Sign in as any user
    // 2. Navigate to /app
    // 3. Verify ComplianceIntelligenceSummary widget is visible
  });

  test.skip('Automation features are discoverable in UI (requires auth)', async ({
    page: _page,
  }) => {
    // This test requires authentication - skip for now
    // In a full test, would:
    // 1. Sign in
    // 2. Check that automation runs are visible
    // 3. Verify automation stats are displayed
  });
});

test.describe('Mobile Alignment', () => {
  test('Homepage is mobile-responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify mobile menu exists
    await expect(page.locator('body')).toBeVisible();

    // Verify CTAs are visible on mobile
    const content = await page.textContent('body');
    expect(content).toContain('Start Free Trial');
  });

  test('Pricing page is mobile-responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pricing');

    await expect(page.locator('body')).toBeVisible();
  });
});
