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

/**
 * =============================================================================
 * Regression: onboarding step-7 completion must not loop back to step 5.
 *
 * The bug: `workspace-recovery.ts` treated an empty `organizations.frameworks`
 * array as definitive evidence that onboarding was unfinished. If a transient
 * RLS/read race made the frameworks read come back empty *after* the user had
 * already completed step 7, the recovery path would:
 *   1. reset `organizations.onboarding_completed = false`
 *   2. write `current_step = 5` into `org_onboarding_status`
 *   3. return `next = /onboarding?step=5`
 *
 * The user was then trapped — each /app load repeated the cycle.
 *
 * These tests exercise the full wire from the `/api/auth/bootstrap` HTTP
 * endpoint → `recoverUserWorkspace` → Supabase → back to the browser and
 * verify the fix at three layers: the HTTP response, the rendered page URL,
 * and the persisted DB state. Pre-fix, every assertion here would fail.
 * =============================================================================
 */

let workspace: WorkspaceSeedContext | null = null;
let bootstrapSkipReason: string | null = null;

type StatusRow = {
  current_step: number | null;
  completed_steps: number[] | null;
  completed_at: string | null;
};

type OrgRow = {
  onboarding_completed: boolean | null;
  onboarding_completed_at: string | null;
  frameworks: string[] | null;
  plan_key: string | null;
  industry: string | null;
};

async function readOrgRow(context: WorkspaceSeedContext): Promise<OrgRow> {
  const { data } = await context.admin
    .from('organizations')
    .select(
      'onboarding_completed, onboarding_completed_at, frameworks, plan_key, industry',
    )
    .eq('id', context.orgId)
    .maybeSingle();
  return (data as OrgRow | null) ?? {
    onboarding_completed: null,
    onboarding_completed_at: null,
    frameworks: null,
    plan_key: null,
    industry: null,
  };
}

async function readStatusRow(
  context: WorkspaceSeedContext,
): Promise<StatusRow> {
  const { data } = await context.admin
    .from('org_onboarding_status')
    .select('current_step, completed_steps, completed_at')
    .eq('organization_id', context.orgId)
    .maybeSingle();
  return (data as StatusRow | null) ?? {
    current_step: null,
    completed_steps: null,
    completed_at: null,
  };
}

/**
 * Stage the exact pathological state that triggered the loop: a user who
 * truly completed onboarding (flag true, status.completed_at set, all
 * completed_steps present) but whose organization.frameworks read will come
 * back empty. We clear `org_frameworks` too so the fallback-backfill path
 * cannot silently repair it — the recovery code must trust the completion
 * signals on its own.
 */
async function stagePathologicalPostCompletionState(
  context: WorkspaceSeedContext,
) {
  await configureWorkspaceState(context, {
    role: 'owner',
    industry: 'healthcare',
    frameworks: [], // triggers the transient-empty-read scenario
    onboardingCompleted: true,
    currentStep: 7,
    completedSteps: [1, 2, 3, 4, 5, 6, 7],
    organizationName: 'Loop Regression Org',
    planKey: 'pro',
    teamSize: '1-10',
    firstAction: 'review_dashboard',
  });

  // configureWorkspaceState re-seeds org_frameworks based on `frameworks`.
  // With [] passed we already get an empty row set, but double-delete any
  // stragglers so the fallback read in resolveFrameworksForOrganization
  // cannot recover data and mask the bug.
  await context.admin
    .from('org_frameworks')
    .delete()
    .eq('organization_id', context.orgId);
}

test.describe('Onboarding completion loop prevention (regression)', () => {
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

  test('wire: /api/auth/bootstrap returns next=/app when flag + status agree, even with empty frameworks', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await stagePathologicalPostCompletionState(context);

    // authenticateWorkspacePage installs the session cookies AND hits the
    // bootstrap endpoint. We re-hit it explicitly after to verify the exact
    // `next` payload at the HTTP boundary.
    const { appBase } = await authenticateWorkspacePage(page);

    const response = await page.request.post(`${appBase}/api/auth/bootstrap`, {
      headers: { 'x-formaos-e2e': '1' },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { next?: string; ok?: boolean };
    expect(body.ok).toBe(true);
    expect(body.next).toBe('/app');
    expect(body.next).not.toMatch(/\/onboarding/);
  });

  test('db: completion flag and status row survive the recovery pass untouched', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await stagePathologicalPostCompletionState(context);

    const orgBefore = await readOrgRow(context);
    const statusBefore = await readStatusRow(context);
    expect(orgBefore.onboarding_completed).toBe(true);
    expect(statusBefore.completed_at).toBeTruthy();
    expect(statusBefore.current_step).toBe(7);

    await authenticateWorkspacePage(page);

    // After the recovery path runs, the authoritative signals must remain
    // intact. Pre-fix, onboarding_completed would have flipped to false and
    // current_step would have been rewritten to 5.
    const orgAfter = await readOrgRow(context);
    const statusAfter = await readStatusRow(context);
    expect(orgAfter.onboarding_completed).toBe(true);
    expect(statusAfter.current_step).toBe(7);
    expect(statusAfter.completed_at).toBeTruthy();
    expect(statusAfter.completed_steps).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('browser: landing path is /app, not /onboarding?step=5', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await stagePathologicalPostCompletionState(context);
    await authenticateWorkspacePage(page);

    // authenticateWorkspacePage navigates to bootstrap.next — with the fix
    // this is /app. Ensure we did not land on the wizard at any step.
    await expect(page).toHaveURL(/\/app(?:\/|$|\?)/);
    expect(page.url()).not.toMatch(/\/onboarding/);
  });

  test('stability: repeated /app visits do not drift state back to the wizard', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await stagePathologicalPostCompletionState(context);
    await authenticateWorkspacePage(page);

    // Three bootstrap cycles — if any call flipped the flag, a subsequent
    // load would return /onboarding?step=5.
    for (let i = 0; i < 3; i += 1) {
      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/app(?:\/|$|\?)/);
    }

    const orgAfter = await readOrgRow(context);
    const statusAfter = await readStatusRow(context);
    expect(orgAfter.onboarding_completed).toBe(true);
    expect(statusAfter.current_step).toBe(7);
  });

  test('direct wizard re-entry: completed user navigating to /onboarding?step=5 is bounced back to /app', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    await stagePathologicalPostCompletionState(context);
    await authenticateWorkspacePage(page);

    // Simulate the old loop's victim: completed user force-navigating to
    // the wizard. The /onboarding page's `explicitlyCompleted` bypass must
    // kick them out to /app even when hasRequiredOnboardingData would say
    // "missing frameworks".
    await page.goto('/onboarding?step=5', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/app(?:\/|$|\?)/, { timeout: 15000 });
  });

  test('positive control: legitimately incomplete user (no flag, no status.completed_at) still goes to /onboarding', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    // Ensure the fix doesn't over-trust: a genuinely mid-flow user with no
    // completion signals must still be routed into the wizard.
    await configureWorkspaceState(context, {
      role: 'owner',
      industry: 'healthcare',
      frameworks: [],
      onboardingCompleted: false,
      currentStep: 5,
      completedSteps: [1, 2, 3, 4],
      organizationName: 'Genuinely Incomplete Org',
      planKey: 'pro',
      teamSize: '1-10',
      firstAction: null,
    });
    await context.admin
      .from('org_frameworks')
      .delete()
      .eq('organization_id', context.orgId);

    const { appBase } = await authenticateWorkspacePage(page);
    const response = await page.request.post(`${appBase}/api/auth/bootstrap`, {
      headers: { 'x-formaos-e2e': '1' },
    });
    const body = (await response.json()) as { next?: string };
    expect(body.next).toMatch(/\/onboarding\?step=5/);
  });

  test('lone-flag repair: flag=true without status corroboration is still reset (safety net intact)', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    expect(workspace).toBeTruthy();
    const context = workspace!;

    // The fix narrows the flag-repair branch to only fire when there is no
    // status corroboration. Verify the narrower branch still catches a
    // pathological lone-flag state so we don't regress the other direction.
    await configureWorkspaceState(context, {
      role: 'owner',
      industry: null,
      frameworks: [],
      onboardingCompleted: true, // lone flag
      currentStep: 2,
      completedSteps: [],
      organizationName: 'Lone Flag Org',
      planKey: null,
      teamSize: '1-10',
      firstAction: null,
    });
    await context.admin
      .from('org_onboarding_status')
      .update({ completed_at: null, current_step: 2, completed_steps: [] })
      .eq('organization_id', context.orgId);
    await context.admin
      .from('org_frameworks')
      .delete()
      .eq('organization_id', context.orgId);

    const { appBase } = await authenticateWorkspacePage(page);
    await page.request.post(`${appBase}/api/auth/bootstrap`, {
      headers: { 'x-formaos-e2e': '1' },
    });

    const orgAfter = await readOrgRow(context);
    // Flag must have been repaired to false because no status row backed it.
    expect(orgAfter.onboarding_completed).toBe(false);
  });
});
