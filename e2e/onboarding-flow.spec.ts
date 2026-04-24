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
        headers: { 'x-formaos-e2e': '1' },
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
        startHere.locator('[data-testid^="start-here-step-"]'),
      ).toHaveCount(FIVE_STEPS);
      await expect(
        startHere.getByTestId('start-here-step-create-care-plan'),
      ).toHaveAttribute('data-done', 'false');

      // Next CTA exists and is linked to care-plans/new for the first step.
      const nextCta = startHere.getByTestId('start-here-next-cta');
      await expect(nextCta).toBeVisible();
      await expect(nextCta).toContainText(/Create your first care plan/i);
      await expect(nextCta).toHaveAttribute(
        'href',
        '/app/care-plans/new',
      );

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

      const { error: planErr } = await admin.from('org_care_plans').insert({
        organization_id: orgId,
        client_id: patientId,
        plan_type: 'support',
        title: `E2E Onboarding Plan ${unique}`,
        start_date: now.slice(0, 10),
        status: 'draft',
        goals: [],
        supports: [],
        created_by: userId,
      });
      expect(planErr).toBeNull();

      // 7. Reload → progress advances to 20%, step 1 marked done, next step
      //    now points to add-goal.
      await page.reload({ waitUntil: 'domcontentloaded' });
      const startHereAfter = page.getByTestId('start-here-card');
      await expect(startHereAfter).toBeVisible();
      await expect(
        startHereAfter.getByTestId('start-here-progress-value'),
      ).toHaveText('20%');
      await expect(
        startHereAfter.getByTestId('start-here-step-create-care-plan'),
      ).toHaveAttribute('data-done', 'true');
      await expect(
        startHereAfter.getByTestId('start-here-next-cta'),
      ).toContainText(/Add your first goal/i);
    } finally {
      if (orgId) {
        // Clean up in dependency order to avoid FK violations.
        await admin.from('org_care_plans').delete().eq('organization_id', orgId);
        await admin.from('org_patients').delete().eq('organization_id', orgId);
        await admin.from('org_frameworks').delete().eq('org_id', orgId);
        await admin.from('org_onboarding_status').delete().eq('organization_id', orgId);
        await admin.from('org_subscriptions').delete().eq('organization_id', orgId);
        await admin.from('org_members').delete().eq('organization_id', orgId);
        await admin.from('organizations').delete().eq('id', orgId);
      }
      if (userId) {
        await admin.auth.admin.deleteUser(userId);
      }
    }
  });
});
