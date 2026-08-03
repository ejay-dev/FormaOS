import { expect, test, type Page } from '@playwright/test';

import {
  authenticateWorkspacePage,
  configureWorkspaceState,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';
import { cleanupTestUser, isE2EAuthBootstrapError } from './helpers/test-auth';

// Every settings subpage renders its title through one SettingsPageHeader, so
// the destination check is the level-1 heading rather than body copy that
// keeps being rewritten. Navigation is driven by href, which outlives the
// card titles above the links.
const SETTINGS_DESTINATIONS = [
  { href: '/app/settings/security', heading: 'Security' },
  { href: '/app/settings/notifications', heading: 'Communications' },
  { href: '/app/settings/email-history', heading: 'Email history' },
  { href: '/app/settings/executive-digest', heading: 'Executive digest' },
  { href: '/app/settings/roles', heading: 'Roles' },
  { href: '/app/settings/auditor-access', heading: 'Auditor access' },
  { href: '/app/settings/retention', heading: 'Retention' },
  { href: '/app/settings/integrations', heading: 'Integrations' },
  { href: '/app/settings/ai', heading: 'AI assistant' },
  { href: '/app/billing', heading: 'Billing and plan' },
] as const;

async function assertNoPageFailure(page: Page) {
  const bodyText = (await page.locator('body').textContent()) ?? '';
  expect(bodyText).not.toMatch(/Unhandled Runtime Error|Application error/i);
  expect(bodyText).not.toMatch(/Configuration Access Denied/i);
  expect(page.url()).not.toMatch(/\/auth\/signin|\/auth\/signup/i);
}

async function openSettings(page: Page) {
  const response = await page.goto('/app/settings', {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  expect(response?.status() ?? 200).toBeLessThan(400);
  await expect(
    page.getByRole('heading', { name: /Workspace settings/i }),
  ).toBeVisible();
  await assertNoPageFailure(page);
}

test.describe('Settings hub', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const context = await getWorkspaceSeedContext();
      await configureWorkspaceState(context, {
        role: 'owner',
        industry: 'healthcare',
        frameworks: ['hipaa'],
        onboardingCompleted: true,
        currentStep: 7,
        completedSteps: [1, 2, 3, 4, 5, 6, 7],
        organizationName: 'Settings Hub Baseline',
        planKey: 'pro',
        teamSize: '1-10',
        firstAction: 'review_dashboard',
      });
      await authenticateWorkspacePage(page, context.email);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error
          ? error.message
          : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('renders live settings state and saves workspace profile changes', async ({
    page,
  }) => {
    const context = await getWorkspaceSeedContext();
    const timestamp = Date.now();
    const updatedName = `Settings Hub E2E ${timestamp}`;
    const updatedIndustry = `healthcare-${timestamp}`;
    const updatedTeamSize = '11-50';

    await configureWorkspaceState(context, {
      role: 'owner',
      industry: 'healthcare',
      frameworks: ['hipaa'],
      onboardingCompleted: true,
      currentStep: 7,
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      organizationName: 'Settings Hub Baseline',
      planKey: 'pro',
      teamSize: '1-10',
      firstAction: 'review_dashboard',
    });

    await openSettings(page);

    await expect(
      page.getByRole('heading', { name: 'Workspace profile' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Configuration areas' }).first(),
    ).toBeVisible();
    // Live state renders once, badged on the configuration-area cards (the
    // former snapshot rail and Communication defaults card echoed the same
    // values a second time and were removed). Each area is asserted by the
    // link it exposes, which survives the card being retitled.
    for (const destination of SETTINGS_DESTINATIONS) {
      await expect(
        page.locator(`a[href="${destination.href}"]`).first(),
        `${destination.href} link should be on the hub`,
      ).toBeVisible();
    }
    await expect(page.locator('[data-testid="delete-account"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Language and accessibility' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Appearance' }).first(),
    ).toBeVisible();

    await page.getByLabel('Legal entity name').fill(updatedName);
    await page.getByLabel('Industry').fill(updatedIndustry);
    await page.getByLabel('Team size').fill(updatedTeamSize);
    // Use force:true to bypass any modal overlay that may intercept the click
    await page
      .getByRole('button', { name: 'Save changes' })
      .first()
      .click({ force: true });
    await expect(
      page.getByRole('button', { name: 'Save changes' }).first(),
    ).toBeEnabled({ timeout: 20_000 });

    await expect
      .poll(
        async () => {
          const { data, error } = await context.admin
            .from('organizations')
            .select('name, industry, team_size')
            .eq('id', context.orgId)
            .maybeSingle();

          if (error) return null;
          return data;
        },
        { timeout: 15_000 },
      )
      .toEqual(
        expect.objectContaining({
          name: updatedName,
          industry: updatedIndustry,
          team_size: updatedTeamSize,
        }),
      );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="name"]').first()).toHaveValue(
      updatedName,
    );
    await expect(page.locator('input[name="industry"]').first()).toHaveValue(
      updatedIndustry,
    );
    await expect(page.locator('input[name="teamSize"]').first()).toHaveValue(
      updatedTeamSize,
    );
  });

  test('all hub links click through to functional settings destinations', async ({
    page,
  }) => {
    for (const destination of SETTINGS_DESTINATIONS) {
      await openSettings(page);

      const link = page.locator(`a[href="${destination.href}"]`).first();
      await expect(link, `${destination.href} link should exist`).toBeVisible();
      await link.click();
      await page.waitForURL(
        new RegExp(`${destination.href.replace(/\//g, '\\/')}`),
        { timeout: 20_000 },
      );

      await expect(
        page.getByRole('heading', { name: destination.heading }).first(),
      ).toBeVisible({ timeout: 25_000 });
      await assertNoPageFailure(page);
    }
  });

  test('the retired email preferences route lands on Communications', async ({
    page,
  }) => {
    await page.goto('/app/settings/email-preferences', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    await expect(page).toHaveURL(/\/app\/settings\/notifications/);
    await expect(
      page.getByRole('heading', { name: 'Communications' }).first(),
    ).toBeVisible({ timeout: 25_000 });
    await assertNoPageFailure(page);
  });

  test('root-page preference controls respond without breaking the hub', async ({
    page,
  }) => {
    await openSettings(page);

    const plainEnglish = page
      .getByRole('checkbox', { name: 'Use plain-English terms' })
      .first();
    await expect(plainEnglish).toBeVisible();
    const initiallyChecked = await plainEnglish.isChecked();
    await plainEnglish.setChecked(!initiallyChecked);
    await expect(plainEnglish).toBeChecked({ checked: !initiallyChecked });

    await page.getByRole('button', { name: /System/i }).click();
    await assertNoPageFailure(page);

    const themeButton = page.getByRole('button', { name: /System/i });
    await expect(themeButton).toBeVisible();
  });
});
