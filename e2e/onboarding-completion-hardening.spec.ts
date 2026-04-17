import { expect, test, type Page } from '@playwright/test';

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
 * Hardening suite — the "QA-type shit" layer.
 *
 * These tests go past the basic regression checks and exercise the onboarding
 * completion → workspace recovery path under stress and boundary conditions:
 *
 *   - Concurrency        — N parallel bootstrap calls must not corrupt state
 *   - Idempotency        — N sequential calls produce identical state
 *   - HTTP chain         — raw redirect traversal without a browser
 *   - Auth boundaries    — unauthed calls return 401 cleanly
 *   - Monotonicity       — completed_steps never shrink; current_step never
 *                          regresses across recovery passes
 *   - Navigation defense — every /onboarding?step=N bounces completed users
 *   - Multi-tab          — two browser contexts share coherent state
 *   - Mid-recovery race  — DB mutation between bootstrap calls stays stable
 *   - Deep-link          — /app/billing direct nav works post-completion
 *   - Response contract  — bootstrap JSON schema is what the app depends on
 *
 * Each test reseeds workspace state before running so they are order-
 * independent within the serial describe block.
 * =============================================================================
 */

let workspace: WorkspaceSeedContext | null = null;
let bootstrapSkipReason: string | null = null;

type BootstrapBody = {
  ok?: boolean;
  next?: string;
  actions?: unknown;
  error?: string;
};

async function stageCompletedState(context: WorkspaceSeedContext) {
  await configureWorkspaceState(context, {
    role: 'owner',
    industry: 'healthcare',
    frameworks: [],
    onboardingCompleted: true,
    currentStep: 7,
    completedSteps: [1, 2, 3, 4, 5, 6, 7],
    organizationName: 'Hardening Suite Org',
    planKey: 'pro',
    teamSize: '1-10',
    firstAction: 'review_dashboard',
  });
  await context.admin
    .from('org_frameworks')
    .delete()
    .eq('organization_id', context.orgId);
}

async function readStatus(context: WorkspaceSeedContext) {
  const { data } = await context.admin
    .from('org_onboarding_status')
    .select('current_step, completed_steps, completed_at')
    .eq('organization_id', context.orgId)
    .maybeSingle();
  return (
    (data as {
      current_step: number | null;
      completed_steps: number[] | null;
      completed_at: string | null;
    } | null) ?? { current_step: null, completed_steps: null, completed_at: null }
  );
}

async function readOrg(context: WorkspaceSeedContext) {
  const { data } = await context.admin
    .from('organizations')
    .select('onboarding_completed, onboarding_completed_at')
    .eq('id', context.orgId)
    .maybeSingle();
  return (
    (data as {
      onboarding_completed: boolean | null;
      onboarding_completed_at: string | null;
    } | null) ?? { onboarding_completed: null, onboarding_completed_at: null }
  );
}

async function postBootstrap(page: Page, appBase: string) {
  return page.request.post(`${appBase}/api/auth/bootstrap`, {
    headers: { 'x-formaos-e2e': '1' },
  });
}

test.describe('Onboarding hardening — concurrency, idempotency, boundaries', () => {
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

  // ---------------------------------------------------------------------------
  // 1. CONCURRENCY — parallel bootstrap barrage must not corrupt completion
  // ---------------------------------------------------------------------------
  test('concurrency: 8 parallel bootstrap calls all return /app and state stays consistent', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    const { appBase } = await authenticateWorkspacePage(page);

    const responses = await Promise.all(
      Array.from({ length: 8 }, () => postBootstrap(page, appBase)),
    );

    const bodies = await Promise.all(
      responses.map(async (r) => ({
        status: r.status(),
        body: (await r.json()) as BootstrapBody,
      })),
    );

    // Rate limiter may claim some — those that return ok must all point /app.
    const okBodies = bodies.filter((b) => b.status === 200);
    expect(okBodies.length).toBeGreaterThan(0);
    for (const b of okBodies) {
      expect(b.body.ok).toBe(true);
      expect(b.body.next).toBe('/app');
    }

    // No corruption: completion state intact.
    const org = await readOrg(context);
    const status = await readStatus(context);
    expect(org.onboarding_completed).toBe(true);
    expect(status.current_step).toBe(7);
    expect(status.completed_steps).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  // ---------------------------------------------------------------------------
  // 2. IDEMPOTENCY — 10 sequential calls must not mutate state
  // ---------------------------------------------------------------------------
  test('idempotency: 10 sequential bootstrap calls leave state byte-identical', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    const { appBase } = await authenticateWorkspacePage(page);

    const orgBefore = await readOrg(context);
    const statusBefore = await readStatus(context);

    for (let i = 0; i < 10; i += 1) {
      const r = await postBootstrap(page, appBase);
      // Rate limit may kick in; any non-200 must NOT be 500.
      if (r.status() !== 200) {
        expect([429]).toContain(r.status());
        break;
      }
      const body = (await r.json()) as BootstrapBody;
      expect(body.next).toBe('/app');
    }

    const orgAfter = await readOrg(context);
    const statusAfter = await readStatus(context);
    expect(orgAfter.onboarding_completed).toBe(orgBefore.onboarding_completed);
    expect(orgAfter.onboarding_completed_at).toBe(
      orgBefore.onboarding_completed_at,
    );
    expect(statusAfter.current_step).toBe(statusBefore.current_step);
    expect(statusAfter.completed_at).toBe(statusBefore.completed_at);
    expect(statusAfter.completed_steps).toEqual(statusBefore.completed_steps);
  });

  // ---------------------------------------------------------------------------
  // 3. NAVIGATION CHAIN — no URL appears more than once during the hop from
  //    /onboarding?step=5 to /app. Uses the real browser navigation events so
  //    Next.js RSC redirects flow through the exact path a user would take.
  // ---------------------------------------------------------------------------
  test('navigation chain: /onboarding?step=5 → /app with no URL repeated in the chain', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    await authenticateWorkspacePage(page);

    const visited: Array<{ url: string; status: number }> = [];
    page.on('response', (r) => {
      if (r.request().isNavigationRequest()) {
        const u = new URL(r.url());
        visited.push({
          url: `${u.pathname}${u.search}`,
          status: r.status(),
        });
      }
    });

    await page.goto('/onboarding?step=5', {
      waitUntil: 'load',
      timeout: 15000,
    });

    await expect(page).toHaveURL(/\/app(?:\/|\?|$)/);

    // Zero URL in the chain should repeat — a loop would re-enter the same
    // path 2+ times.
    const urls = visited.map((v) => v.url);
    const duplicates = urls.filter((u, i) => urls.indexOf(u) !== i);
    expect(
      duplicates,
      `navigation chain contained duplicates: ${JSON.stringify(visited)}`,
    ).toEqual([]);

    // Chain must resolve in a small bounded number of hops.
    expect(visited.length).toBeLessThanOrEqual(5);
    // Final document must NOT be the wizard.
    expect(visited[visited.length - 1]?.url).not.toMatch(/\/onboarding/);
  });

  // ---------------------------------------------------------------------------
  // 4. AUTH BOUNDARY — unauthenticated bootstrap call returns 401 cleanly
  // ---------------------------------------------------------------------------
  test('auth boundary: unauthenticated POST /api/auth/bootstrap returns 401 (not 500)', async ({
    playwright,
    baseURL,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const anonCtx = await playwright.request.newContext({
      baseURL: baseURL ?? 'http://localhost:3000',
    });
    const r = await anonCtx.post('/api/auth/bootstrap', {
      headers: { 'x-formaos-e2e': '1' },
    });
    expect(r.status()).toBe(401);
    const body = (await r.json()) as BootstrapBody;
    expect(body.ok).toBe(false);
    expect(body.error).toBe('unauthorized');
    await anonCtx.dispose();
  });

  // ---------------------------------------------------------------------------
  // 5. MONOTONICITY — completed_steps must never shrink, current_step must
  //    never decrease across recovery passes
  // ---------------------------------------------------------------------------
  test('monotonicity: current_step never regresses and completed_steps never shrinks', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    const { appBase } = await authenticateWorkspacePage(page);

    const samples: Array<{ step: number; size: number }> = [];
    for (let i = 0; i < 5; i += 1) {
      const r = await postBootstrap(page, appBase);
      if (r.status() !== 200) break;
      const s = await readStatus(context);
      samples.push({
        step: s.current_step ?? 0,
        size: (s.completed_steps ?? []).length,
      });
    }

    for (let i = 1; i < samples.length; i += 1) {
      expect(
        samples[i].step,
        `current_step regressed at sample ${i}: ${JSON.stringify(samples)}`,
      ).toBeGreaterThanOrEqual(samples[i - 1].step);
      expect(
        samples[i].size,
        `completed_steps shrunk at sample ${i}: ${JSON.stringify(samples)}`,
      ).toBeGreaterThanOrEqual(samples[i - 1].size);
    }
  });

  // ---------------------------------------------------------------------------
  // 6. NAVIGATION DEFENSE — completed user force-navigating to ANY wizard step
  //    must be bounced to /app
  // ---------------------------------------------------------------------------
  test('navigation defense: every /onboarding?step=1..7 bounces completed user to /app', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    await authenticateWorkspacePage(page);

    for (let step = 1; step <= 7; step += 1) {
      await page.goto(`/onboarding?step=${step}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(
        page,
        `step=${step} did not bounce to /app`,
      ).toHaveURL(/\/app(?:\/|$|\?)/, { timeout: 15000 });
    }
  });

  // ---------------------------------------------------------------------------
  // 7. MULTI-TAB COHERENCE — two browser contexts must see consistent state
  // ---------------------------------------------------------------------------
  test('multi-tab coherence: two authenticated contexts both land on /app', async ({
    browser,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await authenticateWorkspacePage(pageA);
    await authenticateWorkspacePage(pageB);

    await expect(pageA).toHaveURL(/\/app(?:\/|$|\?)/);
    await expect(pageB).toHaveURL(/\/app(?:\/|$|\?)/);

    // Hammer both simultaneously.
    await Promise.all([
      pageA.goto('/app', { waitUntil: 'domcontentloaded' }),
      pageB.goto('/app', { waitUntil: 'domcontentloaded' }),
    ]);
    await expect(pageA).toHaveURL(/\/app(?:\/|$|\?)/);
    await expect(pageB).toHaveURL(/\/app(?:\/|$|\?)/);

    const org = await readOrg(context);
    expect(org.onboarding_completed).toBe(true);

    await ctxA.close();
    await ctxB.close();
  });

  // ---------------------------------------------------------------------------
  // 8. MID-RECOVERY RACE — deleting frameworks between bootstrap calls must
  //    not shake completion loose
  // ---------------------------------------------------------------------------
  test('race: deleting frameworks mid-session still resolves to /app', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    const { appBase } = await authenticateWorkspacePage(page);

    for (let i = 0; i < 3; i += 1) {
      // Hostile mutation between calls.
      await context.admin
        .from('org_frameworks')
        .delete()
        .eq('organization_id', context.orgId);
      await context.admin
        .from('organizations')
        .update({ frameworks: [] })
        .eq('id', context.orgId);

      const r = await postBootstrap(page, appBase);
      if (r.status() === 429) continue;
      expect(r.status()).toBe(200);
      const body = (await r.json()) as BootstrapBody;
      expect(body.next).toBe('/app');

      const org = await readOrg(context);
      expect(org.onboarding_completed).toBe(true);
    }
  });

  // ---------------------------------------------------------------------------
  // 9. DEEP-LINK — /app/billing direct navigation after completion works
  // ---------------------------------------------------------------------------
  test('deep-link: /app/billing directly reachable after completion', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    await authenticateWorkspacePage(page);

    await page.goto('/app/billing', { waitUntil: 'domcontentloaded' });
    // Must not have been intercepted by the onboarding wizard.
    expect(page.url()).not.toMatch(/\/onboarding/);
    // Either landed on /app/billing directly, or was redirected elsewhere
    // within /app (eg. /app/billing/plans). Either is acceptable; the bug
    // would have shown /onboarding?step=5 here.
    await expect(page).toHaveURL(/\/app(?:\/|\?|$)/);
  });

  // ---------------------------------------------------------------------------
  // 10. RESPONSE CONTRACT — bootstrap JSON shape must match what clients use
  // ---------------------------------------------------------------------------
  test('response contract: bootstrap returns { ok: boolean, next: string }', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    const { appBase } = await authenticateWorkspacePage(page);

    const r = await postBootstrap(page, appBase);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toMatch(/application\/json/);
    const body = (await r.json()) as BootstrapBody;

    expect(typeof body.ok).toBe('boolean');
    expect(body.ok).toBe(true);
    expect(typeof body.next).toBe('string');
    expect(body.next!.startsWith('/')).toBe(true);
    // Defensive: make sure we never leak absolute URLs or session tokens.
    expect(body.next).not.toMatch(/^https?:\/\//);
    expect(body.next).not.toMatch(/token|session|sbtoken/i);
  });

  // ---------------------------------------------------------------------------
  // 11. POST-COMPLETION RELOAD LOOP — simulates the exact reported UX: user
  //     at /app refreshes repeatedly, never ends up at the wizard
  // ---------------------------------------------------------------------------
  test('reload loop: 5 rapid /app reloads stay on /app, state unchanged', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    await authenticateWorkspacePage(page);

    const orgBefore = await readOrg(context);

    for (let i = 0; i < 5; i += 1) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/app(?:\/|$|\?)/);
    }

    const orgAfter = await readOrg(context);
    expect(orgAfter.onboarding_completed).toBe(true);
    expect(orgAfter.onboarding_completed_at).toBe(
      orgBefore.onboarding_completed_at,
    );
  });

  // ---------------------------------------------------------------------------
  // 12. CROSS-CONTEXT STALE-STATE — tab A mutates DB, tab B's next bootstrap
  //     reflects reality (no stale cache trapping user)
  // ---------------------------------------------------------------------------
  test('stale-state: after externally flipping flag false, bootstrap reflects it', async ({
    page,
  }) => {
    test.skip(Boolean(bootstrapSkipReason), bootstrapSkipReason ?? undefined);
    const context = workspace!;
    await stageCompletedState(context);
    const { appBase } = await authenticateWorkspacePage(page);

    // External agent flips state to genuinely-incomplete.
    await context.admin
      .from('organizations')
      .update({ onboarding_completed: false })
      .eq('id', context.orgId);
    await context.admin
      .from('org_onboarding_status')
      .update({
        current_step: 5,
        completed_steps: [1, 2, 3, 4],
        completed_at: null,
      })
      .eq('organization_id', context.orgId);

    const r = await postBootstrap(page, appBase);
    if (r.status() === 429) {
      // Rate limited; try one more time after a short wait.
      await page.waitForTimeout(1500);
      const r2 = await postBootstrap(page, appBase);
      expect(r2.status()).toBe(200);
      const body2 = (await r2.json()) as BootstrapBody;
      expect(body2.next).toMatch(/\/onboarding\?step=5/);
      return;
    }
    expect(r.status()).toBe(200);
    const body = (await r.json()) as BootstrapBody;
    expect(body.next).toMatch(/\/onboarding\?step=5/);
  });
});
