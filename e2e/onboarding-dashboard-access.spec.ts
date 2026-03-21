import { expect, test } from '@playwright/test';

import {
  cleanupSecondaryUsers,
  configureWorkspaceState,
  getWorkspaceSeedContext,
  authenticateWorkspacePage,
  type WorkspaceSeedContext,
} from './helpers/workspace-seed';
import {
  E2EAuthBootstrapError,
  cleanupTestUser,
} from './helpers/test-auth';

let workspace: WorkspaceSeedContext | null = null;
let bootstrapSkipReason: string | null = null;

async function clearWorkspaceArtifacts(context: WorkspaceSeedContext) {
  await context.admin.from('team_invitations').delete().eq('organization_id', context.orgId);
  await context.admin.from('org_tasks').delete().eq('organization_id', context.orgId);
}

async function expectSidebarItems(
  page: import('@playwright/test').Page,
  present: string[],
  absent: string[],
) {
  for (const testId of present) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }

  for (const testId of absent) {
    await expect(page.getByTestId(testId)).toHaveCount(0);
  }
}

async function runCurrentUserScenario(
  page: import('@playwright/test').Page,
  context: WorkspaceSeedContext,
  scenario: {
    role: 'owner' | 'admin' | 'member' | 'viewer';
    industry: string;
    expectedDashboard: 'employer' | 'employee';
    present: string[];
    absent: string[];
    organizationName: string;
  },
) {
  await clearWorkspaceArtifacts(context);
  await configureWorkspaceState(context, {
    role: scenario.role,
    industry: scenario.industry,
    frameworks: ['hipaa'],
    onboardingCompleted: true,
    currentStep: 7,
    completedSteps: [1, 2, 3, 4, 5, 6, 7],
    organizationName: scenario.organizationName,
    planKey: 'pro',
    teamSize: '1-10',
    firstAction: 'review_dashboard',
  });

  await authenticateWorkspacePage(page);
  await page.goto('/app', { waitUntil: 'domcontentloaded' });

  if (scenario.expectedDashboard === 'employer') {
    await expect(page.getByTestId('quick-actions')).toBeVisible();
    await expect(page.getByText('My Compliance Status')).toHaveCount(0);
  } else {
    await expect(page.getByText('My Compliance Status')).toBeVisible();
    await expect(page.getByTestId('quick-actions')).toHaveCount(0);
  }

  await expectSidebarItems(page, scenario.present, scenario.absent);
}

test.describe('Onboarding dashboard and sidebar access', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    try {
      workspace = await getWorkspaceSeedContext();
    } catch (error) {
      if (error instanceof E2EAuthBootstrapError) {
        bootstrapSkipReason = error.message;
        return;
      }
      throw error;
    }
  });

  test.afterAll(async () => {
    await cleanupSecondaryUsers();
    await cleanupTestUser();
  });

  test('current owner in healthcare gets employer dashboard and healthcare navigation', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await runCurrentUserScenario(page, context, {
      role: 'owner',
      industry: 'healthcare',
      expectedDashboard: 'employer',
      present: ['nav-dashboard', 'nav-patients', 'nav-staff-credentials', 'nav-team'],
      absent: ['nav-tasks', 'nav-clients'],
      organizationName: 'Persona owner-healthcare',
    });
  });

  test('current admin in enterprise gets employer dashboard and enterprise navigation', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await runCurrentUserScenario(page, context, {
      role: 'admin',
      industry: 'enterprise',
      expectedDashboard: 'employer',
      present: ['nav-dashboard', 'nav-executive', 'nav-team', 'nav-policies'],
      absent: ['nav-clients'],
      organizationName: 'Persona admin-enterprise',
    });
  });

  test('current member in healthcare gets employee dashboard and staff navigation', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await runCurrentUserScenario(page, context, {
      role: 'member',
      industry: 'healthcare',
      expectedDashboard: 'employee',
      present: ['nav-dashboard', 'nav-tasks', 'nav-clients', 'nav-vault'],
      absent: ['nav-patients', 'nav-team', 'nav-executive'],
      organizationName: 'Persona member-healthcare',
    });
  });

  test('current viewer in enterprise gets employee dashboard and read-only staff navigation', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await runCurrentUserScenario(page, context, {
      role: 'viewer',
      industry: 'enterprise',
      expectedDashboard: 'employee',
      present: ['nav-dashboard', 'nav-tasks', 'nav-clients', 'nav-vault'],
      absent: ['nav-policies', 'nav-team', 'nav-executive'],
      organizationName: 'Persona viewer-enterprise',
    });
  });

  test('new owner onboarding completes all steps and lands on the employer dashboard', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await clearWorkspaceArtifacts(context);
    await configureWorkspaceState(context, {
      role: 'owner',
      industry: null,
      frameworks: [],
      onboardingCompleted: false,
      currentStep: 1,
      completedSteps: [],
      organizationName: 'Fresh Health Org',
      planKey: 'pro',
      teamSize: '1-10',
      firstAction: null,
    });

    await authenticateWorkspacePage(page);
    await page.goto('/onboarding?step=1', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Welcome to FormaOS.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=2/);
    await page.getByTestId('organization-name').fill('Northwind Health');
    await page.getByTestId('team-size-1-10').check();
    await page.getByTestId('plan-option-pro').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=3/);
    await page.getByTestId('industry-option-healthcare').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=4/);
    await page.getByTestId('role-option-employer').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=5/);
    await page.getByTestId('framework-option-hipaa').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=6/, { timeout: 60000 });
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=7/, { timeout: 20000 });
    await page.getByTestId('first-action-create-task').check();
    await page.getByRole('button', { name: 'Complete setup' }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 30000 });
    await expect(page.getByTestId('quick-actions')).toBeVisible();
    await expect(
      page.getByTestId('quick-actions').getByText('Patients'),
    ).toBeVisible();
    await expectSidebarItems(
      page,
      ['nav-dashboard', 'nav-patients', 'nav-staff-credentials', 'nav-team'],
      ['nav-tasks', 'nav-clients'],
    );

    const { data: onboardingStatus } = await context.admin
      .from('org_onboarding_status')
      .select('current_step, completed_steps, completed_at, first_action')
      .eq('organization_id', context.orgId)
      .maybeSingle();
    expect(onboardingStatus?.current_step).toBe(7);
    expect(onboardingStatus?.completed_steps).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(onboardingStatus?.first_action).toBe('create_task');
    expect(onboardingStatus?.completed_at).toBeTruthy();

    const { data: kickoffTasks } = await context.admin
      .from('org_tasks')
      .select('title')
      .eq('organization_id', context.orgId)
      .ilike('title', 'Kickoff compliance task');
    expect((kickoffTasks ?? []).length).toBeGreaterThan(0);
  });

  test('new member onboarding fast-tracks to the employee dashboard with staff navigation', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await clearWorkspaceArtifacts(context);
    await configureWorkspaceState(context, {
      role: 'owner',
      industry: 'healthcare',
      frameworks: [],
      onboardingCompleted: false,
      currentStep: 4,
      completedSteps: [1, 2, 3],
      organizationName: 'Fast Track Clinic',
      planKey: 'pro',
      teamSize: '1-10',
      firstAction: null,
    });

    await authenticateWorkspacePage(page);
    await page.goto('/onboarding?step=4', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('role-option-employee').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=7&fast_track=1&persona=member/);
    await expect(page.getByText(/Fast-track enabled/i)).toBeVisible();
    await page.getByTestId('first-action-create-task').check();
    await page.getByRole('button', { name: 'Complete setup' }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 30000 });
    await expect(page.getByText('My Compliance Status')).toBeVisible();
    await expect(page.getByTestId('quick-actions')).toHaveCount(0);
    await expectSidebarItems(
      page,
      ['nav-dashboard', 'nav-tasks', 'nav-clients', 'nav-vault'],
      ['nav-patients', 'nav-team', 'nav-executive'],
    );
  });

  test('new viewer onboarding stays read-only and still lands on a valid dashboard', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await clearWorkspaceArtifacts(context);
    await configureWorkspaceState(context, {
      role: 'owner',
      industry: 'enterprise',
      frameworks: [],
      onboardingCompleted: false,
      currentStep: 4,
      completedSteps: [1, 2, 3],
      organizationName: 'Audit Ready Enterprise',
      planKey: 'enterprise',
      teamSize: '11-50',
      firstAction: null,
    });

    await authenticateWorkspacePage(page);
    await page.goto('/onboarding?step=4', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('role-option-external_auditor').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=7&fast_track=1&persona=viewer/);
    await expect(page.getByTestId('first-action-review-dashboard')).toBeVisible();
    await expect(page.getByTestId('first-action-create-task')).toHaveCount(0);
    await page.getByTestId('first-action-review-dashboard').check();
    await page.getByRole('button', { name: 'Complete setup' }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 30000 });
    await expect(page.getByText('My Compliance Status')).toBeVisible();
    await expectSidebarItems(
      page,
      ['nav-dashboard', 'nav-tasks', 'nav-clients', 'nav-vault'],
      ['nav-policies', 'nav-team', 'nav-executive'],
    );
  });
});
