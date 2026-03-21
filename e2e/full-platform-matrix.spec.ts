import { expect, test, type Page } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

import {
  authenticateWorkspacePage,
  cleanupSecondaryUsers,
  configureWorkspaceState,
  createSecondaryUser,
  ensureFrameworkScore,
  getWorkspaceSeedContext,
  type WorkspaceSeedContext,
} from './helpers/workspace-seed';
import {
  E2EAuthBootstrapError,
  cleanupTestUser,
} from './helpers/test-auth';
import {
  FRAMEWORK_OPTIONS,
  INDUSTRY_OPTIONS,
  PLAN_OPTIONS,
} from '../lib/validators/organization';
import { PLAN_CATALOG, type PlanKey } from '../lib/plans';
import { PACK_SLUGS } from '../lib/frameworks/framework-installer';
import { getIndustryNavigation } from '../lib/navigation/industry-sidebar';

loadEnv({ path: '.env.local' });

type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

type SecondaryAccount = {
  email: string;
  password: string;
  userId: string;
};

const INDUSTRIES = INDUSTRY_OPTIONS.map((option) => option.id);
const PLANS = PLAN_OPTIONS.map((option) => option.id as PlanKey);
const FRAMEWORK_MATRIX = Array.from(
  new Set([
    ...FRAMEWORK_OPTIONS.map((option) => option.id),
    ...PACK_SLUGS,
  ]),
);
const SCOREABLE_FRAMEWORKS = new Set(PACK_SLUGS);
const DEFAULT_FRAMEWORKS = ['soc2', 'hipaa'];
const REAL_MARKETING_ROUTES = [
  '/',
  '/product',
  '/pricing',
  '/industries',
  '/features',
  '/security',
  '/contact',
  '/enterprise',
  '/frameworks',
  '/evaluate',
  '/prove',
  '/operate',
  '/govern',
];

let workspace: WorkspaceSeedContext | null = null;
let bootstrapSkipReason: string | null = null;
let adminUser: SecondaryAccount | null = null;
let memberUser: SecondaryAccount | null = null;
let viewerUser: SecondaryAccount | null = null;
const signupUserIds = new Set<string>();

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function getActorForRole(role: UserRole) {
  if (!workspace) {
    throw new Error('Workspace not initialized');
  }

  switch (role) {
    case 'owner':
      return {
        email: workspace.email,
        userId: workspace.userId,
      };
    case 'admin':
      if (!adminUser) throw new Error('Admin test user not initialized');
      return adminUser;
    case 'member':
      if (!memberUser) throw new Error('Member test user not initialized');
      return memberUser;
    case 'viewer':
      if (!viewerUser) throw new Error('Viewer test user not initialized');
      return viewerUser;
  }
}

async function setMembershipRole(userId: string, role: UserRole) {
  if (!workspace) throw new Error('Workspace not initialized');

  const { error } = await workspace.admin
    .from('org_members')
    .update({ role })
    .eq('organization_id', workspace.orgId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to set role ${role} for ${userId}: ${error.message}`);
  }
}

async function syncPlanSubscription(planKey: PlanKey) {
  if (!workspace) throw new Error('Workspace not initialized');

  const now = new Date().toISOString();
  const trialExpiresAt = addDays(14);
  const entitlementRows =
    planKey === 'enterprise'
      ? [
          { feature_key: 'team_limit', enabled: true, limit_value: 500 },
          { feature_key: 'team', enabled: true, limit_value: null },
          { feature_key: 'automation', enabled: true, limit_value: null },
          { feature_key: 'sso', enabled: true, limit_value: null },
        ]
      : planKey === 'pro'
        ? [
            { feature_key: 'team_limit', enabled: true, limit_value: 75 },
            { feature_key: 'team', enabled: true, limit_value: null },
            { feature_key: 'automation', enabled: true, limit_value: null },
          ]
        : [
            { feature_key: 'team_limit', enabled: true, limit_value: 5 },
            { feature_key: 'team', enabled: false, limit_value: null },
          ];

  await workspace.admin
    .from('organizations')
    .update({
      plan_key: planKey,
      updated_at: now,
    })
    .eq('id', workspace.orgId);

  const { data: subscription } = await workspace.admin
    .from('org_subscriptions')
    .select('id')
    .eq('organization_id', workspace.orgId)
    .maybeSingle();

  if (subscription?.id) {
    await workspace.admin
      .from('org_subscriptions')
      .update({
        plan_key: planKey,
        status: 'trialing',
        trial_started_at: now,
        trial_expires_at: trialExpiresAt,
        updated_at: now,
      })
      .eq('id', subscription.id);
  } else {
    await workspace.admin.from('org_subscriptions').insert({
      organization_id: workspace.orgId,
      plan_key: planKey,
      status: 'trialing',
      trial_started_at: now,
      trial_expires_at: trialExpiresAt,
      created_at: now,
      updated_at: now,
    });
  }

  await workspace.admin
    .from('org_entitlements')
    .delete()
    .eq('organization_id', workspace.orgId);

  for (const row of entitlementRows) {
    await workspace.admin.from('org_entitlements').insert({
      organization_id: workspace.orgId,
      ...row,
      created_at: now,
      updated_at: now,
    });
  }
}

async function prepareScenario(
  role: UserRole,
  industry: string,
  planKey: PlanKey = 'enterprise',
  frameworks: string[] = DEFAULT_FRAMEWORKS,
) {
  if (!workspace) throw new Error('Workspace not initialized');

  const actor = getActorForRole(role);
  await setMembershipRole(actor.userId, role);
  await configureWorkspaceState(workspace, {
    role: 'owner',
    industry,
    frameworks,
    onboardingCompleted: true,
    currentStep: 7,
    completedSteps: [1, 2, 3, 4, 5, 6, 7],
    organizationName: `Matrix ${role} ${industry}`,
    planKey,
    teamSize: '11-50',
    firstAction: 'review_dashboard',
  });
  await syncPlanSubscription(planKey);

  return actor;
}

async function assertDashboardShell(page: Page, role: UserRole) {
  if (role === 'owner' || role === 'admin') {
    await expect(page.getByTestId('quick-actions')).toBeVisible();
    await expect(page.getByText('My Compliance Status')).toHaveCount(0);
    return;
  }

  await expect(page.getByText('My Compliance Status')).toBeVisible();
  await expect(page.getByTestId('quick-actions')).toHaveCount(0);
}

async function assertNoAppCrash(page: Page, href: string) {
  let response: Awaited<ReturnType<Page['goto']>> | null = null;

  try {
    response = await page.goto(href, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('ERR_ABORTED')) {
      throw error;
    }
  }

  const currentUrl = new URL(page.url());
  const landedPath = currentUrl.pathname;
  const status = response?.status() ?? null;
  const body = (await page.locator('body').textContent()) ?? '';

  expect(
    landedPath === href || landedPath.startsWith(`${href}/`),
    `${href} landed on unexpected path ${landedPath}`,
  ).toBe(true);
  expect(
    status === null ||
      [200, 201, 204, 302, 303, 307, 308, 401, 403].includes(status),
    `${href} returned unexpected status ${status}`,
  ).toBe(true);
  expect(body).not.toContain('This page could not be found');
  expect(body).not.toContain("FormaOS couldn't load");
  expect(body).not.toContain('Minified React error');
}

async function waitForAuthUserByEmail(email: string) {
  if (!workspace) throw new Error('Workspace not initialized');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await workspace.admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email.toLowerCase(),
    );
    if (match) {
      return match;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for auth user ${email}`);
}

async function expectCtasToReachAuth(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  const body = (await page.locator('body').textContent()) ?? '';

  expect(body).not.toContain('This page could not be found');

  const ctas = page.locator(
    'a[href*="/auth/signup"], a[href*="/auth/signin"], a[href*="/app"], button',
  );
  const count = await ctas.count();
  expect(count, `${route} should surface at least one app/auth CTA`).toBeGreaterThan(0);
}

test.describe('Full platform matrix', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    try {
      workspace = await getWorkspaceSeedContext();
      adminUser = await createSecondaryUser(workspace, {
        role: 'admin',
        addMembership: true,
      });
      memberUser = await createSecondaryUser(workspace, {
        role: 'member',
        addMembership: true,
      });
      viewerUser = await createSecondaryUser(workspace, {
        role: 'viewer',
        addMembership: true,
      });
    } catch (error) {
      if (error instanceof E2EAuthBootstrapError) {
        bootstrapSkipReason = error.message;
        return;
      }
      throw error;
    }
  });

  test.afterAll(async () => {
    if (workspace) {
      for (const userId of signupUserIds) {
        await workspace.admin.auth.admin.deleteUser(userId).catch(() => undefined);
      }
    }
    await cleanupSecondaryUsers();
    await cleanupTestUser();
  });

  for (const industry of INDUSTRIES) {
    test(`owner navigation for ${industry} stays intact across every sidebar route`, async ({
      page,
    }) => {
      test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);

      const actor = await prepareScenario('owner', industry, 'enterprise');
      await authenticateWorkspacePage(page, actor.email);
      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      await assertDashboardShell(page, 'owner');

      const { navigation } = getIndustryNavigation(industry, 'owner');
      const routableItems = navigation.filter(
        (item) => item.href.startsWith('/app') && item.testId,
      );

      for (const item of routableItems) {
        await expect(page.getByTestId(item.testId!)).toBeVisible();
      }

      for (const item of routableItems) {
        const routePage = await page.context().newPage();
        try {
          await assertNoAppCrash(routePage, item.href);
        } finally {
          await routePage.close();
        }
      }
    });
  }

  for (const industry of INDUSTRIES) {
    for (const role of ['owner', 'admin', 'member', 'viewer'] as UserRole[]) {
      test(`${role} user in ${industry} lands in the correct dashboard shell`, async ({
        page,
      }) => {
        test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);

        const actor = await prepareScenario(role, industry, 'enterprise');
        await authenticateWorkspacePage(page, actor.email);
        await page.goto('/app', { waitUntil: 'domcontentloaded' });
        await assertDashboardShell(page, role);

        const { navigation } = getIndustryNavigation(industry, role);
        const expectedTestIds = navigation
          .map((item) => item.testId)
          .filter((value): value is string => Boolean(value));

        for (const testId of expectedTestIds) {
          await expect(page.getByTestId(testId)).toBeVisible();
        }
      });
    }
  }

  for (const planKey of PLANS) {
    test(`billing stays coherent for the ${planKey} plan`, async ({ page }) => {
      test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);

      const actor = await prepareScenario('owner', 'enterprise', planKey);
      await authenticateWorkspacePage(page, actor.email);
      await assertNoAppCrash(page, '/app/billing');
      await expect(page.getByText('Billing & Plan')).toBeVisible();
      await expect(
        page
          .locator('div.text-xl.font-semibold')
          .filter({ hasText: new RegExp(`^${PLAN_CATALOG[planKey].name}$`) }),
      ).toBeVisible();
      await expect(page.getByText('trialing')).toBeVisible();
    });
  }

  for (const frameworkSlug of FRAMEWORK_MATRIX) {
    test(`framework library renders for ${frameworkSlug}`, async ({ page }) => {
      test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
      if (!workspace) {
        throw new Error('Workspace not initialized');
      }

      const actor = await prepareScenario('owner', 'enterprise', 'enterprise', [
        frameworkSlug,
      ]);

      if (SCOREABLE_FRAMEWORKS.has(frameworkSlug)) {
        await ensureFrameworkScore(workspace, frameworkSlug, 86);
      }

      await authenticateWorkspacePage(page, actor.email);
      await assertNoAppCrash(page, '/app/compliance/frameworks');
      await expect(
        page.getByRole('heading', { name: 'Framework Library' }).first(),
      ).toBeVisible();
      await expect(page.getByText(/^Enabled framework$/).first()).toBeVisible();

      if (frameworkSlug === 'soc2') {
        await assertNoAppCrash(page, '/app/compliance/soc2');
      }
    });
  }

  for (const route of REAL_MARKETING_ROUTES) {
    test(`marketing route ${route} loads with a working app/auth CTA`, async ({
      page,
    }) => {
      await expectCtasToReachAuth(page, route);
    });
  }

  test('new email user can sign up and reach the check-email handoff', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    if (!workspace) {
      throw new Error('Workspace not initialized');
    }

    const timestamp = Date.now();
    const email = `ejazhussaini313+formaos-signup-${timestamp}@gmail.com`;
    const password = `FormaOS!${timestamp}StrongPass`;

    await page.goto('/auth/signup', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create FormaOS Account' }).click();

    await page.waitForURL(/\/auth\/check-email/, { timeout: 20_000 });
    await expect(page.getByText(/Check.*Email/i)).toBeVisible();

    const createdUser = await waitForAuthUserByEmail(email);
    signupUserIds.add(createdUser.id);
  });

  test('confirmed password user can sign in through the email form', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    if (!workspace) {
      throw new Error('Workspace not initialized');
    }

    const passwordUser = await createSecondaryUser(workspace, {
      role: 'member',
      addMembership: true,
    });
    await setMembershipRole(passwordUser.userId, 'member');
    await configureWorkspaceState(workspace, {
      role: 'owner',
      industry: 'enterprise',
      frameworks: DEFAULT_FRAMEWORKS,
      onboardingCompleted: true,
      currentStep: 7,
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      organizationName: 'Password Sign-in Org',
      planKey: 'enterprise',
      teamSize: '11-50',
      firstAction: 'review_dashboard',
    });
    await syncPlanSubscription('enterprise');

    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
    const signInEmail = page.locator('input[type="email"]');
    const signInPassword = page.locator('input[type="password"]').first();
    await signInEmail.fill(passwordUser.email);
    await signInPassword.fill(passwordUser.password);
    await expect(signInEmail).toHaveValue(passwordUser.email);
    await expect(signInPassword).toHaveValue(passwordUser.password);
    await page.getByRole('button', { name: 'Access FormaOS' }).click();

    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30_000 });
    await expect(page.locator('body')).toContainText(/FormaOS|Welcome|Dashboard/i);
  });
});
