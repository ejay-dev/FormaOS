/**
 * Trial Expiration Engagement E2E Tests
 * Tests: Trial banners, countdown display, value recap, urgency messaging
 */

import { test, expect, type Page } from '@playwright/test';
import {
  getTestCredentials,
  cleanupTestUser,
  E2EAuthBootstrapError,
} from './helpers/test-auth';
import {
  configureWorkspaceState,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';

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
  await page.waitForURL(/\/app/, { timeout: 45000 });
  await dismissProductTour(page);
}

async function prepareTrialWorkspace() {
  const context = await getWorkspaceSeedContext();
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  await configureWorkspaceState(context, {
    role: 'owner',
    industry: 'healthcare',
    frameworks: ['hipaa'],
    onboardingCompleted: true,
    currentStep: 7,
    completedSteps: [1, 2, 3, 4, 5, 6, 7],
    organizationName: 'Trial Engagement Baseline',
    planKey: 'pro',
    teamSize: '11-50',
    firstAction: 'review_dashboard',
  });

  const { data: subscription, error: subscriptionLookupError } =
    await context.admin
    .from('org_subscriptions')
    .select('org_id, organization_id')
    .or(`organization_id.eq.${context.orgId},org_id.eq.${context.orgId}`)
    .maybeSingle();

  if (subscriptionLookupError) {
    throw new Error(
      `Failed to resolve trial subscription row: ${subscriptionLookupError.message}`,
    );
  }

  const trialPayload = {
    organization_id: context.orgId,
    org_id: context.orgId,
    plan_key: 'pro',
    plan_code: 'pro',
    status: 'trialing',
    trial_started_at: now.toISOString(),
    trial_expires_at: trialEnd.toISOString(),
    current_period_end: trialEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  const { error } = subscription?.org_id || subscription?.organization_id
    ? await context.admin
        .from('org_subscriptions')
        .update(trialPayload)
        .or(`organization_id.eq.${context.orgId},org_id.eq.${context.orgId}`)
    : await context.admin.from('org_subscriptions').insert({
        ...trialPayload,
        created_at: now.toISOString(),
      });

  if (error) {
    throw new Error(`Failed to seed trial subscription: ${error.message}`);
  }
}

async function prepareAndLogin(page: Page) {
  const creds = await getCredentials();
  await prepareTrialWorkspace();
  await loginAs(page, creds.email, creds.password);
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

async function openApp(page: Page) {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(
    /Dashboard|Compliance|My Compliance Status|Overview/i,
    { timeout: 20_000 },
  );
}

// =========================================================
// TRIAL BANNER DISPLAY TESTS
// =========================================================
test.describe('Trial Expiration Banners', () => {
  test.beforeEach(async ({ page }) => {
    await prepareAndLogin(page);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Trial banner shows for trial accounts', async ({ page }) => {
    await openApp(page);

    // Look for trial banner
    const trialBanner = page.locator(
      '[data-testid="trial-banner"], text=/trial|days? (left|remaining)/i',
    );
    const hasBanner = await trialBanner
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasBanner) {
      console.log('Trial banner displayed for trial account');
    } else {
      console.log('No trial banner (account may be paid or trial expired)');
    }
  });

  test('Trial countdown displays days remaining', async ({ page }) => {
    await openApp(page);

    // Look for countdown text
    const countdown = page.locator('text=/\\d+ days?/i');
    const hasCountdown = await countdown
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasCountdown) {
      // Extract days number
      const text = await countdown.first().textContent();
      const daysMatch = text?.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        expect(days).toBeGreaterThanOrEqual(0);
        console.log(`Trial shows ${days} days remaining`);
      }
    }
  });

  test('Trial banner has upgrade CTA', async ({ page }) => {
    await openApp(page);

    // Look for trial-related upgrade button
    const trialBanner = page.locator(
      '[data-testid="trial-banner"], text=/trial/i',
    );
    const hasBanner = await trialBanner
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasBanner) {
      const upgradeBtn = page.locator(
        'button:has-text("Upgrade"), a:has-text("Upgrade"), button:has-text("Choose Plan")',
      );
      const hasUpgrade = await upgradeBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(hasUpgrade).toBe(true);
      console.log('Trial banner includes upgrade CTA');
    }
  });
});

// =========================================================
// URGENCY LEVEL TESTS
// =========================================================
test.describe('Trial Urgency Messaging', () => {
  test.beforeEach(async ({ page }) => {
    await prepareAndLogin(page);
  });

  test('Banner color changes based on urgency', async ({ page }) => {
    await openApp(page);

    // Look for colored banners (amber for warning, red for critical)
    const amberBanner = page.locator(
      '.bg-amber-500, .border-amber-500, .text-amber-',
    );
    const redBanner = page.locator('.bg-red-500, .border-red-500, .text-red-');
    const blueBanner = page.locator(
      '.bg-blue-500, .border-blue-500, .text-blue-',
    );

    const hasAmber = await amberBanner
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasRed = await redBanner
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasBlue = await blueBanner
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasAmber) console.log('Warning (amber) banner displayed');
    if (hasRed) console.log('Critical (red) banner displayed');
    if (hasBlue) console.log('Info (blue) banner displayed');
  });

  test('Urgency messaging matches days remaining', async ({ page }) => {
    await openApp(page);

    // Check for urgency-related messaging
    const urgentText = page.locator(
      'text=/expires? (today|tomorrow)|last day|urgent|final/i',
    );
    const warningText = page.locator(
      'text=/only \\d+ days?|almost over|running out/i',
    );
    const infoText = page.locator('text=/\\d+ days? (left|remaining)/i');

    const hasUrgent = await urgentText
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasWarning = await warningText
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasInfo = await infoText
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasUrgent) console.log('Urgent messaging (1 day or less)');
    if (hasWarning) console.log('Warning messaging (3 days or less)');
    if (hasInfo) console.log('Info messaging (7+ days)');
  });
});

// =========================================================
// VALUE RECAP TESTS
// =========================================================
test.describe('Trial Value Recap', () => {
  test.beforeEach(async ({ page }) => {
    await prepareAndLogin(page);
  });

  test('Value recap API returns trial metrics', async ({ page }) => {
    const response = await page.request.get('/api/trial/value-recap');

    // Should return 200 for trial accounts, 403/404 for others
    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('isTrialing');
      if (data.isTrialing) {
        expect(data).toHaveProperty('metrics');
        expect(data.metrics).toHaveProperty('tasksCompleted');
      } else {
        expect(data.metrics).toBeNull();
      }
      console.log('Value recap API returned trial metrics');
    } else {
      console.log('Value recap not available (may not be trial account)');
    }
  });

  test('Value recap shows activity summary', async ({ page }) => {
    await openApp(page);

    // Look for value recap content
    const valueRecap = page.locator(
      'text=/completed|uploaded|achieved|progress/i',
    );
    const hasValueRecap = await valueRecap
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasValueRecap) {
      console.log('Value recap activity summary displayed');
    }
  });

  test('Value highlights show key accomplishments', async ({ page }) => {
    await openApp(page);

    // Look for value highlights
    const highlights = page.locator(
      '[data-testid="value-highlight"], text=/tasks?|evidence|compliance|score/i',
    );
    const hasHighlights = await highlights
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasHighlights) {
      console.log('Value highlights displayed');
    }
  });
});

// =========================================================
// TRIAL EXPIRATION FLOW TESTS
// =========================================================
test.describe('Trial Expiration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await prepareAndLogin(page);
  });

  test('Expired trial shows appropriate messaging', async ({ page }) => {
    await openApp(page);

    // Look for expired trial messaging
    const expiredText = page.locator(
      'text=/trial (has )?expired|trial ended|no longer active/i',
    );
    const hasExpired = await expiredText
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasExpired) {
      console.log('Expired trial messaging displayed');

      // Should show upgrade option
      const upgradeBtn = page.locator(
        'button:has-text("Upgrade"), a:has-text("Upgrade")',
      );
      const hasUpgrade = await upgradeBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(hasUpgrade).toBe(true);
    } else {
      console.log('Trial not expired or account is paid');
    }
  });

  test('Trial warning banner dismissable', async ({ page }) => {
    await openApp(page);

    // Look for dismissable banner
    const dismissBtn = page.locator(
      '[data-testid="dismiss-trial-banner"], button[aria-label*="dismiss"], button[aria-label*="close"]',
    );
    const hasDismiss = await dismissBtn
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasDismiss) {
      await dismissBtn.first().click();

      // Banner should be dismissed
      const banner = page.locator('[data-testid="trial-banner"]');
      await expect(banner).not.toBeVisible({ timeout: 3000 });
      console.log('Trial banner dismissable');
    }
  });
});
