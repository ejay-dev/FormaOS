import { expect, test, type Page } from '@playwright/test';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';
import { cleanupTestUser, isE2EAuthBootstrapError } from './helpers/test-auth';

const ROUTES_TO_VALIDATE = [
  {
    href: '/app/settings/security',
    expected:
      /Security Controls|Multi-Factor Authentication|SSO Configuration/i,
  },
  {
    href: '/app/settings/notifications',
    expected: /Delivery Preferences|Delivery Matrix/i,
  },
  {
    href: '/app/settings/email-preferences',
    expected: /Email Preferences|Manage which emails/i,
  },
  {
    href: '/app/settings/email-history',
    expected: /Email Delivery History|transactional communications/i,
  },
  {
    href: '/app/settings/executive-digest',
    expected: /Executive Digest|automated compliance summary/i,
  },
  {
    href: '/app/settings/roles',
    expected: /Roles & Permissions|Default Roles|Custom Roles/i,
  },
  {
    href: '/app/settings/auditor-access',
    expected: /Auditor Access|Access Grants|Grant Access/i,
  },
  {
    href: '/app/settings/retention',
    expected: /Document Retention|Retention Policies|Legal Holds/i,
  },
  {
    href: '/app/settings/integrations',
    expected: /Integration Control Plane|Connected|Healthy/i,
  },
  {
    href: '/app/settings/ai',
    expected: /AI Settings|Usage Overview|Document Indexing/i,
  },
  {
    href: '/app/billing',
    expected: /Billing|Subscription|Plan|Trial/i,
  },
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
      await authenticateWorkspacePage(page);
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

    await openSettings(page);

    await expect(page.getByText('Workspace profile')).toBeVisible();
    await expect(page.getByText('Configuration areas')).toBeVisible();
    await expect(page.getByText('Security snapshot')).toBeVisible();
    await expect(page.getByText('Notification routing')).toBeVisible();
    await expect(page.getByText('Workspace operations')).toBeVisible();
    await expect(page.getByText('Communication defaults')).toBeVisible();
    await expect(page.getByText('Language & Accessibility')).toBeVisible();
    await expect(page.getByText('Appearance')).toBeVisible();

    await page.getByLabel('Legal entity name').fill(updatedName);
    await page.getByLabel('Industry').fill(updatedIndustry);
    await page.getByLabel('Team size').fill(updatedTeamSize);
    // Use force:true to bypass any modal overlay that may intercept the click
    await page
      .getByRole('button', { name: /Commit Profile/i })
      .click({ force: true });
    await expect(
      page.getByRole('button', { name: /Commit Profile|Saving/i }),
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
    await expect(page.locator('input[name="name"]')).toHaveValue(updatedName);
    await expect(page.locator('input[name="industry"]')).toHaveValue(
      updatedIndustry,
    );
    await expect(page.locator('input[name="teamSize"]')).toHaveValue(
      updatedTeamSize,
    );
  });

  test('all hub links click through to functional settings destinations', async ({
    page,
  }) => {
    for (const route of ROUTES_TO_VALIDATE) {
      await openSettings(page);

      const link = page.locator(`a[href="${route.href}"]`).first();
      await expect(link, `${route.href} link should exist`).toBeVisible();
      await link.click();
      await page.waitForURL(new RegExp(`${route.href.replace(/\//g, '\\/')}`), {
        timeout: 20_000,
      });

      const bodyText = (await page.locator('body').textContent()) ?? '';
      expect(bodyText).toMatch(route.expected);
      await assertNoPageFailure(page);
    }
  });

  test('root-page preference controls respond without breaking the hub', async ({
    page,
  }) => {
    await openSettings(page);

    const plainEnglish = page.getByLabel('Use plain-English terms');
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
