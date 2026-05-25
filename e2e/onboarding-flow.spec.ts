import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import {
  createMagicLinkSession,
  setPlaywrightSession,
} from './helpers/test-auth';

const FIVE_STEPS = 5;
const APP_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

function resolveEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Onboarding E2E requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return { url, serviceRoleKey };
}

test.describe('Onboarding first-session flow', () => {
  test('new user sees Start here with 0/5 then progresses after first action', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const { url, serviceRoleKey } = resolveEnv();
    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const unique = Date.now();
    const email = `e2e-onboarding-${unique}@test.formaos.local`;
    const password = `TestPass-${unique}!`;
    const now = new Date().toISOString();

    // 1. Create fresh org fully provisioned so recovery/redirects don't fire.
    const { data: orgRow, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: `E2E Onboarding Org ${unique}`,
        industry: 'ndis',
        plan_key: 'pro',
        frameworks: ['iso27001'],
        onboarding_completed: true,
        onboarding_completed_at: now,
        created_at: now,
      })
      .select('id')
      .single();

    expect(orgError).toBeNull();
    const orgId = (orgRow as { id: string } | null)?.id;
    expect(orgId).toBeTruthy();

    // 2. Create fresh user.
    const { data: userData, error: userError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { is_e2e_test: true },
      });
    if (userError) {
      const e = userError as { name?: string; message?: string };
      if (
        e.name === 'AuthRetryableFetchError' ||
        e.message === '{}' ||
        e.message === ''
      ) {
        test.skip(
          true,
          `Supabase admin API unavailable (${e.name ?? 'network error'}) — skipping`,
        );
        return;
      }
    }
    expect(userError).toBeNull();
    const userId = userData.user?.id;
    expect(userId).toBeTruthy();

    // 3. Attach membership + subscription + onboarding-complete scaffolding.
    await admin.from('org_members').insert({
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
    });
    await admin.from('org_subscriptions').insert({
      organization_id: orgId,
      plan_key: 'pro',
      status: 'active',
      created_at: now,
      updated_at: now,
    });
    await admin.from('org_onboarding_status').insert({
      organization_id: orgId,
      current_step: 6,
      completed_steps: [1, 2, 3, 4, 5],
      completed_at: now,
      updated_at: now,
    });
    await admin.from('org_frameworks').insert({
      org_id: orgId,
      framework_slug: 'iso27001',
      enabled_at: now,
    });

    try {
      // 4. Sign in as the fresh user.
      const session = await createMagicLinkSession(email);
      await setPlaywrightSession(page.context(), session, APP_BASE);
      await page.request.post(`${APP_BASE}/api/auth/bootstrap`, {
        headers: { 'x-formaos-e2e': '1', Origin: APP_BASE },
      });

      // 5. Dashboard should render Start here at 0/5.
      await page.goto('/app', { waitUntil: 'domcontentloaded' });

      try {
        await page
          .locator('button', { hasText: /Accept all/i })
          .first()
          .click({ timeout: 1500 });
      } catch {
        /* no cookie banner */
      }

      const startHere = page.getByTestId('start-here-card');
      await expect(startHere).toBeVisible();
      await expect(
        startHere.getByTestId('start-here-progress-value'),
      ).toHaveText('0%');
      await expect(
        startHere.getByTestId('start-here-progress-count'),
      ).toHaveText(/0 of 5 completed/);
      await expect(
        startHere.locator('[data-testid^="start-here-step-"]'),
      ).toHaveCount(FIVE_STEPS);
      await expect(
        startHere.getByTestId('start-here-step-create-care-plan'),
      ).toHaveAttribute('data-done', 'false');

      // Next CTA exists and is linked to care-plans/new for the first step.
      const nextCta = startHere.getByTestId('start-here-next-cta');
      await expect(nextCta).toBeVisible();
      await expect(nextCta).toContainText(/Create your first care plan/i);
      await expect(nextCta).toHaveAttribute('href', '/app/care-plans/new');

      // Compliance micro-explanation renders under the active step.
      await expect(
        startHere.getByTestId('start-here-compliance-create-care-plan'),
      ).toContainText(/audit/i);

      // Persistent Continue-onboarding strip is visible in the shell.
      const strip = page.getByTestId('onboarding-strip');
      await expect(strip).toBeVisible();
      await expect(strip.getByTestId('onboarding-strip-label')).toContainText(
        /Create your first care plan/i,
      );
      await expect(strip.getByTestId('onboarding-strip-cta')).toHaveAttribute(
        'href',
        '/app/care-plans/new',
      );

      // Strip persists across navigation (open tasks page).
      await page.goto('/app/tasks', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('onboarding-strip')).toBeVisible();
      await expect(page.getByTestId('onboarding-strip-label')).toContainText(
        /Create your first care plan/i,
      );

      // Guidance middleware: tasks page is off-track for step 1
      // (basePath is /app/care-plans). Guide appears with next step + CTA.
      const guide = page.getByTestId('onboarding-guide');
      await expect(guide).toBeVisible();
      await expect(
        guide.getByTestId('onboarding-guide-step-label'),
      ).toContainText(/Create your first care plan/i);
      await expect(guide.getByTestId('onboarding-guide-cta')).toHaveAttribute(
        'href',
        '/app/care-plans/new',
      );

      // "Remind me later" dismisses for the session.
      await guide.getByTestId('onboarding-guide-later').click();
      await expect(page.getByTestId('onboarding-guide')).toHaveCount(0);

      // 6. Simulate the user completing step 1 (creating a care plan).
      //    org_care_plans requires a patient (client_id FK) — seed one first.
      const { data: patientRow, error: patientErr } = await admin
        .from('org_patients')
        .insert({
          organization_id: orgId,
          full_name: `E2E Onboarding Patient ${unique}`,
          care_status: 'active',
          risk_level: 'low',
        })
        .select('id')
        .single();
      expect(patientErr).toBeNull();
      const patientId = (patientRow as { id: string } | null)?.id;
      expect(patientId).toBeTruthy();

      const { data: planRow, error: planErr } = await admin
        .from('org_care_plans')
        .insert({
          organization_id: orgId,
          client_id: patientId,
          plan_type: 'support',
          title: `E2E Onboarding Plan ${unique}`,
          start_date: now.slice(0, 10),
          status: 'draft',
          goals: [],
          supports: [],
          created_by: userId,
        })
        .select('id')
        .single();
      expect(planErr).toBeNull();
      const planId = (planRow as { id: string } | null)?.id;
      expect(planId).toBeTruthy();

      // 7. Return to /app → progress advances to 20%, step 1 marked done,
      //    next step now points to add-goal. Strip reflects the new next step.
      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      const startHereAfter = page.getByTestId('start-here-card');
      await expect(startHereAfter).toBeVisible();
      await expect(
        startHereAfter.getByTestId('start-here-progress-value'),
      ).toHaveText('20%');
      await expect(
        startHereAfter.getByTestId('start-here-progress-count'),
      ).toHaveText(/1 of 5 completed/);
      await expect(
        startHereAfter.getByTestId('start-here-step-create-care-plan'),
      ).toHaveAttribute('data-done', 'true');
      await expect(
        startHereAfter.getByTestId('start-here-next-cta'),
      ).toContainText(/Add your first goal/i);
      await expect(page.getByTestId('onboarding-strip-label')).toContainText(
        /Add your first goal/i,
      );

      // 8. Emotional feedback: first-step success toast appears once.
      const toast = page.getByTestId('onboarding-success-toast');
      await expect(toast).toBeVisible();
      await expect(toast).toHaveAttribute('data-step', 'create-care-plan');
      await expect(toast).toContainText(/Great.*Care Plan/i);

      // Dismiss — this fires the mark-seen server action that persists
      // acknowledgment. Firing on mount races with form submissions on
      // sibling routes, so we wait for explicit dismiss instead.
      await toast.getByTestId('onboarding-success-toast-dismiss').click();
      await page.waitForTimeout(1500);

      // Persistence depends on the 20260425 migration being applied. Probe
      // the table; if the migration hasn't run yet, skip the persistence
      // assertions but keep the UI-surface checks above.
      const probe = await admin
        .from('org_first_session_progress')
        .select('organization_id')
        .limit(1);
      const progressTableExists = !probe.error;

      if (progressTableExists) {
        const { data: seenRow } = await admin
          .from('org_first_session_progress')
          .select('seen_steps')
          .eq('organization_id', orgId)
          .maybeSingle();
        expect(
          (seenRow as { seen_steps?: string[] } | null)?.seen_steps,
        ).toContain('create-care-plan');

        // 9. Reload — toast must NOT reappear (persisted across page loads).
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('start-here-card')).toBeVisible();
        await expect(page.getByTestId('onboarding-success-toast')).toHaveCount(
          0,
        );
      } else {
        test.info().annotations.push({
          type: 'skip',
          description:
            'Migration 20260425_first_session_progress not yet applied — persistence assertions skipped.',
        });
      }

      // 10. Open the freshly-created care plan → contextual banner appears for
      //    the add-goal step with scroll-to-goals CTA.
      await page.goto(`/app/care-plans/${planId}`, {
        waitUntil: 'domcontentloaded',
      });
      const banner = page.getByTestId('onboarding-banner');
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute('data-step', 'add-goal');
      await expect(banner.getByTestId('onboarding-banner-cta')).toBeVisible();

      // 11. Seed a goal → next step becomes log-progress-note, which maps to
      //     /app/participants in NDIS nav. Sidebar should now surface the
      //     "Next" onboarding badge on that nav item.
      await admin
        .from('org_care_plans')
        .update({
          goals: [
            {
              id: `goal-${unique}`,
              title: 'E2E Goal',
              status: 'pending',
              progress_percentage: 0,
            },
          ],
        })
        .eq('id', planId);

      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('onboarding-strip-label')).toContainText(
        /Log your first progress note/i,
      );

      // Second emotional beat: toast for add-goal. Only reliable once the
      // previous step was marked seen — gate on migration state.
      if (progressTableExists) {
        const toast2 = page.getByTestId('onboarding-success-toast');
        await expect(toast2).toBeVisible();
        await expect(toast2).toHaveAttribute('data-step', 'add-goal');
      }

      // Sidebar shows the "Next" pill on the participants nav item
      // (matches log-progress-note step) and dims non-matching items.
      await expect(
        page
          .locator('[data-testid="nav-participants"]')
          .locator('[data-testid="nav-onboarding-next"]'),
      ).toBeVisible();

      const dimmedNavCount = await page
        .locator('[data-testid^="nav-"][class*="text-muted-foreground"]')
        .count();
      expect(dimmedNavCount).toBeGreaterThan(0);

      // 12. Complete the remaining 3 steps via admin seeds → PostOnboardingHero
      //     replaces StartHereCard on /app with concrete next-action CTAs.
      await admin.from('org_progress_notes').insert({
        organization_id: orgId,
        patient_id: patientId,
        staff_user_id: userId,
        note_text: 'E2E: first progress note',
        status_tag: 'routine',
      });
      const { data: taskRow } = await admin
        .from('org_tasks')
        .insert({
          organization_id: orgId,
          title: `E2E Onboarding Task ${unique}`,
          status: 'pending',
        })
        .select('id')
        .single();
      const taskId = (taskRow as { id: string } | null)?.id;
      await admin.from('org_evidence').insert({
        organization_id: orgId,
        task_id: taskId,
        file_name: 'e2e-evidence.pdf',
        file_path: `evidence/e2e-${unique}.pdf`,
      });

      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      const postHero = page.getByTestId('post-onboarding-hero');
      await expect(postHero).toBeVisible();
      await expect(
        postHero.getByTestId('post-onboarding-cta-incidents'),
      ).toHaveAttribute('href', '/app/incidents');
      await expect(
        postHero.getByTestId('post-onboarding-cta-staff'),
      ).toHaveAttribute('href', '/app/staff-compliance');
      await expect(
        postHero.getByTestId('post-onboarding-cta-compliance'),
      ).toHaveAttribute('href', '/app/compliance');
      // StartHereCard should be gone once setup is complete.
      await expect(page.getByTestId('start-here-card')).toHaveCount(0);
    } finally {
      if (orgId) {
        // Clean up in dependency order to avoid FK violations.
        await admin
          .from('org_first_session_progress')
          .delete()
          .eq('organization_id', orgId);
        await admin.from('org_evidence').delete().eq('organization_id', orgId);
        await admin.from('org_tasks').delete().eq('organization_id', orgId);
        await admin
          .from('org_progress_notes')
          .delete()
          .eq('organization_id', orgId);
        await admin
          .from('org_care_plans')
          .delete()
          .eq('organization_id', orgId);
        await admin.from('org_patients').delete().eq('organization_id', orgId);
        await admin.from('org_frameworks').delete().eq('org_id', orgId);
        await admin
          .from('org_onboarding_status')
          .delete()
          .eq('organization_id', orgId);
        await admin
          .from('org_subscriptions')
          .delete()
          .eq('organization_id', orgId);
        await admin.from('org_members').delete().eq('organization_id', orgId);
        await admin.from('organizations').delete().eq('id', orgId);
        await admin.from('orgs').delete().eq('id', orgId);
      }
      if (userId) {
        await admin.auth.admin.deleteUser(userId);
      }
    }
  });
});
