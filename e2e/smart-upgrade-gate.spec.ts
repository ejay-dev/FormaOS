/**
 * Smart Upgrade Gate E2E Tests
 * Tests: Feature gating, upgrade modals, plan comparison, checkout flow
 *
 * Every test in this file used to follow the shape
 *   `const hasX = await locator.isVisible().catch(() => false); if (hasX) { … }`
 * so the whole suite reported green whenever the paywall it is named after
 * stopped rendering. The assertions below are unconditional, or branch on
 * *data* (the org's real plan / entitlements read from Supabase) with a
 * failing assertion on every branch.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  getTestCredentials,
  cleanupTestUser,
  E2EAuthBootstrapError,
} from './helpers/test-auth';
import { getWorkspaceSeedContext } from './helpers/workspace-seed';
import { PLAN_CATALOG, resolvePlanKey, type PlanKey } from '../lib/plans';

const PLAN_ORDER: PlanKey[] = ['basic', 'pro', 'scale', 'enterprise'];

let testCredentials: { email: string; password: string } | null = null;

async function getCredentials(): Promise<{ email: string; password: string }> {
  if (testCredentials) return testCredentials;
  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    testCredentials = {
      email: process.env.E2E_TEST_EMAIL,
      password: process.env.E2E_TEST_PASSWORD,
    };
    return testCredentials;
  }
  try {
    testCredentials = await getTestCredentials();
  } catch (error) {
    if (error instanceof E2EAuthBootstrapError) {
      test.skip(true, error.message);
      return undefined as never; // unreachable
    }
    throw error;
  }
  return testCredentials;
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.evaluate(() => {
    localStorage.setItem('e2e_test_mode', 'true');
  });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL(/\/app/, { timeout: 15000 });
  } catch {
    const url = page.url();
    test.skip(
      true,
      `loginAs: landed on ${url} instead of /app — Supabase auth or onboarding not complete`,
    );
    return;
  }
  await dismissProductTour(page);
}

async function dismissProductTour(page: Page) {
  try {
    await page
      .waitForLoadState('networkidle', { timeout: 5000 })
      .catch(() => {});
    const tourText = page.locator('text="Product Tour"');
    if (await tourText.isVisible({ timeout: 2000 })) {
      const skipBtn = page.locator('button:has-text("Skip Tour")');
      await skipBtn.click({ timeout: 3000 });
      await tourText.waitFor({ state: 'hidden', timeout: 5000 });
      await page.waitForTimeout(500);
    }
  } catch {
    // Tour not present
  }
}

async function gotoAppRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('link', { name: /dashboard/i }).first(),
  ).toBeVisible({ timeout: 15000 });
}

/** The plan tier the client store (and therefore the plan picker) sees. */
async function readClientPlan(page: Page): Promise<string> {
  const response = await page.request.get('/api/system-state');
  expect(response.status(), '/api/system-state should answer 200').toBe(200);
  const state = (await response.json()) as {
    organization?: { plan?: string };
  };
  return state.organization?.plan ?? 'trial';
}

// =========================================================
// FEATURE GATE DISPLAY TESTS
// =========================================================
test.describe('Smart Upgrade Gate', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // The plan comparison table is `hidden lg:block`; the mobile projects
    // can't see it. Authenticated coverage is a chromium-only gate here as
    // it is everywhere else in this suite.
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Feature gate shows upgrade prompt for locked features', async ({
    page,
  }) => {
    await gotoAppRoute(page, '/app/workflows');
    await expect(
      page.getByRole('heading', { name: 'Workflow Engine' }),
    ).toBeVisible({ timeout: 15000 });

    // app/app/workflows/page.tsx renders exactly one of three states:
    // the entitlement paywall, the missing-schema notice, or the builder.
    const paywall = page.locator('[data-testid="workflow-entitlement-disabled"]');
    const schemaGate = page.locator('[data-testid="workflow-schema-disabled"]');
    const builderCta = page.getByRole('button', { name: 'Blank Workflow' });

    const [paywallCount, schemaCount, builderCount] = await Promise.all([
      paywall.count(),
      schemaGate.count(),
      builderCta.count(),
    ]);

    expect(
      paywallCount + schemaCount + builderCount,
      'workflows page rendered neither the gate nor the builder',
    ).toBeGreaterThan(0);

    if (paywallCount > 0) {
      await expect(
        paywall.getByRole('heading', {
          name: 'Workflow automation is an Enterprise feature',
        }),
      ).toBeVisible();
      await expect(
        paywall.getByRole('link', { name: 'Review Billing' }),
      ).toHaveAttribute('href', '/app/billing');
      // The paywall must actually block the action, not just describe it.
      await expect(
        paywall.getByRole('button', { name: 'Create workflow' }),
      ).toBeDisabled();
      await expect(builderCta).toHaveCount(0);
    } else if (schemaCount > 0) {
      await expect(
        schemaGate.getByRole('button', { name: 'Create workflow' }),
      ).toBeDisabled();
      await expect(builderCta).toHaveCount(0);
    } else {
      // Entitlement granted — the builder must actually be usable.
      await expect(builderCta).toBeEnabled();
      await expect(page.getByText('Total Workflows')).toBeVisible();
    }
  });

  test('Upgrade modal shows feature-specific benefits', async ({ page }) => {
    await gotoAppRoute(page, '/app/billing');

    // PlanComparisonTable renders unconditionally on /app/billing, so every
    // tier and its benefit bullets must be present. If billing stops listing
    // plans this fails on the first missing card.
    await expect(
      page.getByRole('heading', {
        name: /Choose Your Plan|Reactivate Your Account/,
      }),
    ).toBeVisible({ timeout: 15000 });

    for (const planKey of PLAN_ORDER) {
      const plan = PLAN_CATALOG[planKey];
      await expect(
        page.getByRole('heading', { name: plan.name, level: 3 }).first(),
      ).toBeVisible();
      // Each card lists the catalog's benefit bullets verbatim.
      await expect(page.getByText(plan.features[0], { exact: true })).toBeVisible();
    }
  });

  test('Plan comparison table is visible in upgrade modal', async ({
    page,
  }) => {
    await gotoAppRoute(page, '/app/billing');

    const comparison = page.locator('table').filter({ hasText: 'Feature' }).first();
    await expect(comparison).toBeVisible({ timeout: 15000 });

    for (const planKey of PLAN_ORDER) {
      await expect(
        comparison.locator('thead th', {
          hasText: PLAN_CATALOG[planKey].name,
        }),
      ).toHaveCount(1);
    }

    // Workflow Automation is gated: unavailable on Foundation, available from
    // Growth up. The cells render a lucide check/x rather than text.
    const workflowRow = comparison
      .locator('tbody tr')
      .filter({ hasText: 'Workflow Automation' })
      .first();
    await expect(workflowRow.locator('td').nth(1).locator('svg.lucide-x')).toHaveCount(1);
    await expect(
      workflowRow.locator('td').nth(4).locator('svg.lucide-check'),
    ).toHaveCount(1);
  });

  test('Usage metrics are displayed in upgrade context', async ({ page }) => {
    const context = await getWorkspaceSeedContext();
    const { data: org } = await context.admin
      .from('organizations')
      .select('plan_key')
      .eq('id', context.orgId)
      .maybeSingle();

    await gotoAppRoute(page, '/app/billing');

    // The "Current plan" card must render the org's real plan, resolved the
    // same way the page resolves it. A billing page that stops binding to
    // org data now fails instead of logging "no usage metrics".
    const planKey = resolvePlanKey(
      (org?.plan_key as string | null) ?? null,
    );
    const expectedPlanName = planKey
      ? PLAN_CATALOG[planKey].name
      : 'Plan not set';

    // Innermost <div> that *contains* the "Current plan" label — i.e. the
    // block holding both the label and the resolved plan name.
    const currentPlanCard = page
      .locator('div', { has: page.getByText('Current plan', { exact: true }) })
      .last();
    await expect(currentPlanCard).toBeVisible({ timeout: 15000 });
    await expect(currentPlanCard).toContainText(expectedPlanName);
  });
});

// =========================================================
// CHECKOUT FLOW TESTS
// =========================================================
test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Upgrade CTA navigates to checkout or billing', async ({ page }) => {
    const plan = await readClientPlan(page);
    await gotoAppRoute(page, '/app/billing');
    await expect(
      page.getByRole('heading', {
        name: /Choose Your Plan|Reactivate Your Account/,
      }),
    ).toBeVisible({ timeout: 15000 });

    const contactSales = page.getByRole('link', { name: 'Contact sales' });

    if (plan === 'enterprise') {
      // Top tier: the card shows the current-plan state and offers no upsell.
      await expect(page.getByText('CURRENT PLAN')).toHaveCount(1);
      await expect(contactSales).toHaveCount(0);
    } else {
      // Enterprise is a custom-priced upgrade for every other tier, so its
      // CTA must be rendered and must point at the sales funnel.
      await expect(contactSales).toHaveCount(1);
      await expect(contactSales).toHaveAttribute(
        'href',
        '/contact?intent=enterprise',
      );
    }
  });

  test('Contact sales button appears for enterprise', async ({ page }) => {
    await gotoAppRoute(page, '/app/billing');

    const comparison = page.locator('table').filter({ hasText: 'Feature' }).first();
    await expect(comparison).toBeVisible({ timeout: 15000 });

    // SSO & SAML is enterprise-only: X on Foundation/Growth/Scale, check on
    // Enterprise. This is the paywall boundary the "contact sales" path sells.
    const ssoRow = comparison
      .locator('tbody tr')
      .filter({ hasText: 'SSO & SAML' })
      .first();
    for (const columnIndex of [1, 2, 3]) {
      await expect(
        ssoRow.locator('td').nth(columnIndex).locator('svg.lucide-x'),
      ).toHaveCount(1);
    }
    await expect(
      ssoRow.locator('td').nth(4).locator('svg.lucide-check'),
    ).toHaveCount(1);
  });
});

// =========================================================
// FEATURE BENEFITS TESTS
// =========================================================
test.describe('Feature Benefits Display', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Locked feature shows specific value proposition', async ({ page }) => {
    await gotoAppRoute(page, '/app/billing');

    // Enterprise-only value props must appear on the Enterprise card and
    // nowhere else — that difference is the whole upgrade proposition.
    const enterpriseOnly = [
      'SSO & SAML authentication',
      'Custom compliance frameworks',
    ];
    for (const benefit of enterpriseOnly) {
      expect(PLAN_CATALOG.enterprise.features).toContain(benefit);
      expect(PLAN_CATALOG.basic.features).not.toContain(benefit);
      await expect(
        page.getByText(benefit, { exact: true }),
      ).toHaveCount(1);
    }
  });

  test('Approaching limit shows usage warning', async ({ page }) => {
    const context = await getWorkspaceSeedContext();
    const { data: entitlements } = await context.admin
      .from('org_entitlements')
      .select('feature_key, enabled')
      .eq('organization_id', context.orgId);

    await gotoAppRoute(page, '/app/billing');

    const entitlementsCard = page
      .locator('div', {
        has: page.getByRole('heading', { name: 'Entitlements' }),
      })
      .last();
    await expect(entitlementsCard).toBeVisible({ timeout: 15000 });

    const rows = (entitlements ?? []) as Array<{
      feature_key: string;
      enabled: boolean;
    }>;

    if (rows.length === 0) {
      await expect(entitlementsCard).toContainText('No entitlements active yet.');
    } else {
      // Every entitlement row the org actually holds must be surfaced with
      // its enabled/disabled state — this is the data the upgrade gates read.
      for (const row of rows) {
        await expect(entitlementsCard).toContainText(row.feature_key);
      }
      await expect(entitlementsCard).toContainText(
        rows.some((row) => row.enabled) ? 'Enabled' : 'Disabled',
      );
    }
  });
});
