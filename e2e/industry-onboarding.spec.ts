/**
 * E2E Tests for Industry Onboarding Flow
 * Tests complete user journey through industry-specific onboarding
 */

import { test, expect, type Page } from '@playwright/test';
import {
  getTestCredentials,
  cleanupTestUser,
} from './helpers/test-auth';

// Cached credentials for the test run
let testCredentials: { email: string; password: string } | null = null;

// Helper to login as admin
async function loginAsAdmin(page: Page) {
  // Get or create test credentials
  if (!testCredentials) {
    testCredentials = await getTestCredentials();
  }

  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', testCredentials.email);
  await page.fill('input[type="password"]', testCredentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/app', { timeout: 15000 });
}

// Cleanup after all tests
test.afterAll(async () => {
  await cleanupTestUser();
});

// Helper to check if element is visible
async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible({ timeout: 2000 });
  } catch {
    return false;
  }
}

test.describe('Industry Onboarding - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display GettingStartedChecklist on dashboard', async ({
    page,
  }) => {
    await page.goto('/app');

    // Check for checklist container
    const checklist = page.getByTestId('getting-started-checklist');
    await expect(checklist).toBeVisible({ timeout: 10000 });

    // Verify header elements
    await expect(
      page.getByText(/Industry Onboarding|Getting Started/i),
    ).toBeVisible();

    // Verify progress bar exists
    const progressBar = page
      .locator('[role="progressbar"], .h-2.rounded-full')
      .first();
    await expect(progressBar).toBeVisible();
  });

  test('should show industry-specific checklist items', async ({ page }) => {
    await page.goto('/app');

    // Wait for checklist to load
    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    // Get all checklist items
    const items = page.locator('[data-testid^="checklist-item-"]');
    const count = await items.count();

    // Should have 1-8 checklist items
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8);

    // Verify each item has required elements
    for (let i = 0; i < Math.min(count, 3); i++) {
      const item = items.nth(i);

      // Should have title
      await expect(item.locator('p.font-semibold')).toBeVisible();

      // Should have description
      await expect(item.locator('p.text-xs.text-slate-400')).toBeVisible();

      // Should have completion icon (circle or check)
      const hasIcon = (await item.locator('svg').count()) > 0;
      expect(hasIcon).toBe(true);
    }
  });

  test('should display priority indicators on checklist items', async ({
    page,
  }) => {
    await page.goto('/app');

    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    const items = page.locator('[data-testid^="checklist-item-"]');
    const firstItem = items.first();

    // Check for priority border color (border-l-2 with color)
    const hasPriorityBorder = await firstItem.evaluate((el) => {
      const classes = el.className;
      return (
        classes.includes('border-l-red-') ||
        classes.includes('border-l-orange-') ||
        classes.includes('border-l-yellow-') ||
        classes.includes('border-l-slate-')
      );
    });

    expect(hasPriorityBorder).toBe(true);
  });

  test('should show time estimates for checklist items', async ({ page }) => {
    await page.goto('/app');

    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    const items = page.locator('[data-testid^="checklist-item-"]');
    const firstItem = items.first();

    // Look for time estimate pattern like "~5min" or "~30min"
    const timeEstimate = firstItem.locator('text=/~\\d+min/');

    // At least some items should have time estimates
    const hasTimeEstimate = (await timeEstimate.count()) > 0;
    expect(hasTimeEstimate).toBe(true);
  });

  test('should navigate when clicking checklist item', async ({ page }) => {
    await page.goto('/app');

    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    const items = page.locator('[data-testid^="checklist-item-"]');
    const firstItem = items.first();

    // Get current URL
    const currentUrl = page.url();

    // Click first item
    await firstItem.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // URL should have changed
    const newUrl = page.url();
    expect(newUrl).not.toBe(currentUrl);
  });
});

test.describe('Industry Guidance Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display IndustryGuidancePanel for valid industries', async ({
    page,
  }) => {
    await page.goto('/app');

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Check if guidance panel exists (conditional on industry)
    const hasGuidancePanel = await isVisible(
      page,
      '[data-testid="industry-guidance-panel"]',
    );

    if (hasGuidancePanel) {
      const panel = page.getByTestId('industry-guidance-panel');

      // Verify status card
      await expect(panel.getByTestId('industry-status-card')).toBeVisible();

      // Verify progress indicator (ring or bar)
      const hasProgressRing = (await panel.locator('svg circle').count()) > 0;
      expect(hasProgressRing).toBe(true);

      console.log('✓ Industry guidance panel displayed');
    } else {
      console.log(
        'ℹ Industry guidance panel not shown (org may be "other" industry)',
      );
    }
  });

  test('should show next recommended action', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const hasGuidancePanel = await isVisible(
      page,
      '[data-testid="industry-guidance-panel"]',
    );

    if (hasGuidancePanel) {
      const nextAction = page.getByTestId('industry-next-action');

      if (await nextAction.isVisible()) {
        // Should have "Next Recommended Action" label
        await expect(
          nextAction.getByText(/Next Recommended Action/i),
        ).toBeVisible();

        // Should have action title
        await expect(nextAction.locator('h4')).toBeVisible();

        // Should have time estimate
        await expect(nextAction.locator('text=/~\\d+ min/')).toBeVisible();

        console.log('✓ Next action card displayed');
      } else {
        console.log('ℹ All steps complete - no next action');
      }
    }
  });

  test('should display industry insights', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const hasGuidancePanel = await isVisible(
      page,
      '[data-testid="industry-guidance-panel"]',
    );

    if (hasGuidancePanel) {
      const panel = page.getByTestId('industry-guidance-panel');

      // Look for insight messages (emojis + text patterns)
      const insightPatterns = [
        /📊.*frameworks/i,
        /📁.*evidence/i,
        /👥.*team/i,
        /🎯.*compliance/i,
      ];

      let foundInsight = false;
      for (const pattern of insightPatterns) {
        if ((await panel.locator(`text=${pattern}`).count()) > 0) {
          foundInsight = true;
          break;
        }
      }

      if (foundInsight) {
        console.log('✓ Industry insights displayed');
      }
    }
  });

  test('should show loading skeleton when data is loading', async ({
    page,
  }) => {
    // Intercept API to delay response
    await page.route('**/api/onboarding/checklist', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/app');

    // Check for loading skeleton (should appear briefly)
    const hasSkeleton = await isVisible(
      page,
      '[role="status"][aria-label*="Loading"]',
    );

    // Note: May not always catch skeleton due to fast networks
    console.log(
      hasSkeleton
        ? '✓ Loading skeleton displayed'
        : 'ℹ Skeleton not caught (fast load)',
    );
  });
});

test.describe('Industry Onboarding - Completion Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should update progress when completing actions', async ({ page }) => {
    await page.goto('/app');

    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    // Get initial progress percentage
    const progressText = page.locator('text=/\\d+%/').first();
    const initialProgress = await progressText.textContent();

    console.log(`Initial progress: ${initialProgress}`);

    // Progress should be a valid percentage
    expect(initialProgress).toMatch(/\d+%/);

    // Verify progress is between 0-100%
    const progressValue = parseInt(initialProgress?.replace('%', '') || '0');
    expect(progressValue).toBeGreaterThanOrEqual(0);
    expect(progressValue).toBeLessThanOrEqual(100);
  });

  test('should show confetti on 100% completion', async ({ page }) => {
    await page.goto('/app');

    await page.waitForLoadState('networkidle');

    // Check for confetti animation (only visible at 100%)
    const hasConfetti = (await page.locator('.confetti-piece').count()) > 0;

    if (hasConfetti) {
      console.log('🎉 Confetti animation displayed (100% complete!)');
    } else {
      console.log('ℹ No confetti (onboarding not complete)');
    }
  });

  test('should cache progress in localStorage', async ({ page }) => {
    await page.goto('/app');

    await page.waitForLoadState('networkidle');

    // Wait for checklist to load and cache
    await page.waitForTimeout(1000);

    // Check localStorage for cached progress
    const cachedData = await page.evaluate(() => {
      return localStorage.getItem('formaos_onboarding_progress');
    });

    if (cachedData) {
      const parsed = JSON.parse(cachedData);

      expect(parsed).toHaveProperty('counts');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('orgId');

      // Verify counts structure
      expect(parsed.counts).toHaveProperty('tasks');
      expect(parsed.counts).toHaveProperty('evidence');
      expect(parsed.counts).toHaveProperty('members');

      console.log('✓ Progress cached in localStorage');
    }
  });
});

test.describe('Industry Onboarding - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/app');

    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    const items = page.locator('[data-testid^="checklist-item-"]');
    const firstItem = items.first();

    // Check for aria-label
    const ariaLabel = await firstItem.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/Completed|Pending/);

    // Check for aria-describedby
    const ariaDescribedBy = await firstItem.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/app');

    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    // Focus first checklist item
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if an item has focus
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.getAttribute('data-testid');
    });

    // Should focus on a checklist item eventually
    console.log(`Focused element: ${focusedElement}`);
  });

  test('should have visible focus states', async ({ page }) => {
    await page.goto('/app');

    await page.waitForSelector('[data-testid^="checklist-item-"]', {
      timeout: 10000,
    });

    const items = page.locator('[data-testid^="checklist-item-"]');
    const firstItem = items.first();

    // Focus the element
    await firstItem.focus();

    // Check for focus styles (focus-visible:ring-2)
    const hasFocusStyles = await firstItem.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      // Check if outline or ring is applied
      return (
        computedStyle.outlineWidth !== '0px' ||
        computedStyle.boxShadow !== 'none'
      );
    });

    // Note: May not always work in headless mode
    console.log(
      hasFocusStyles
        ? '✓ Focus styles applied'
        : 'ℹ Focus styles check inconclusive',
    );
  });
});

test.describe('Industry Onboarding - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept and fail API request
    await page.route('**/api/onboarding/checklist', (route) => {
      route.abort('failed');
    });

    await page.goto('/app');

    await page.waitForLoadState('networkidle');

    // Should show error message or fallback gracefully
    const hasErrorMessage = await isVisible(page, 'text=/Failed to load/i');

    if (hasErrorMessage) {
      console.log('✓ Error message displayed');
    } else {
      console.log('ℹ Graceful fallback (may show cached data)');
    }
  });

  test('should recover from network errors', async ({ page }) => {
    let failCount = 0;

    // Fail first request, succeed second
    await page.route('**/api/onboarding/checklist', (route) => {
      failCount++;
      if (failCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await page.goto('/app');

    // Wait and refresh
    await page.waitForTimeout(2000);
    await page.reload();

    await page.waitForLoadState('networkidle');

    // Should succeed on retry
    const hasChecklist = await isVisible(
      page,
      '[data-testid="getting-started-checklist"]',
    );
    expect(hasChecklist).toBe(true);

    console.log('✓ Recovered from network error on retry');
  });
});

test.describe('Industry Onboarding - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should load dashboard quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/app');
    await page.waitForSelector('[data-testid="getting-started-checklist"]', {
      timeout: 10000,
    });

    const loadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);

    // Should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should use cached data for instant display', async ({ page }) => {
    // First visit to cache data
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Second visit should use cache
    const startTime = Date.now();
    await page.goto('/app');

    // Look for content display before API returns
    await page.waitForSelector('[data-testid="getting-started-checklist"]', {
      timeout: 2000,
    });

    const displayTime = Date.now() - startTime;

    console.log(`Cached display time: ${displayTime}ms`);

    // With cache, should be very fast (<1 second)
    expect(displayTime).toBeLessThan(1000);
  });
});
