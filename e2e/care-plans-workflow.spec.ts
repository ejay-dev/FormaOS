import { expect, test } from '@playwright/test';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedParticipant,
} from './helpers/workspace-seed';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test.describe('Care plans workflow', () => {
  // 2026-08-02: this spec used to insert an org_patients row and an
  // org_care_plans row with `context.admin` (service role), update the status
  // with the same client, read it back and assert the values it had just
  // written. Service role bypasses RLS and no server action, page or
  // validation ever ran — it only proved Postgres returns what was written,
  // while the name promised care-plan workflow coverage. It now drives the
  // real status transitions through /app/care-plans/[id], which calls
  // `updateCarePlanStatus` (app/app/actions/care-operations.ts) under the
  // signed-in user's RLS context and writes an audit event.
  test('tracks care plan lifecycle states from draft to review due', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    test.setTimeout(240_000);

    const context = await getWorkspaceSeedContext();
    const unique = Date.now();
    const planTitle = `E2E Care Plan ${unique}`;

    const participant = await seedParticipant(context, {
      fullName: `E2E Patient ${unique}`,
      careStatus: 'active',
      riskLevel: 'low',
    });
    const participantId = participant.id as string;
    expect(participantId).toBeTruthy();

    let planId: string | null = null;

    try {
      const { data: createdPlan, error: createdPlanError } = await context.admin
        .from('org_care_plans')
        .insert({
          organization_id: context.orgId,
          client_id: participantId,
          plan_type: 'support',
          title: planTitle,
          description: 'E2E care plan workflow',
          start_date: isoDateOffset(-1),
          review_date: isoDateOffset(7),
          status: 'draft',
          goals: [],
          supports: [],
          created_by: context.userId,
        })
        .select('id, status')
        .single();

      expect(createdPlanError).toBeNull();
      expect(createdPlan?.status).toBe('draft');
      planId = createdPlan?.id as string;
      expect(planId).toBeTruthy();

      // RLS read path: the signed-in member's own (anon-key) client must be
      // able to see the plan. The service-role client above cannot prove this.
      const { data: rlsRead, error: rlsReadError } = await context.anon
        .from('org_care_plans')
        .select('id, title, status')
        .eq('id', planId)
        .maybeSingle();
      expect(rlsReadError).toBeNull();
      expect(
        rlsRead,
        'RLS denied the plan owner read access to their own care plan',
      ).not.toBeNull();
      expect((rlsRead as { title?: string } | null)?.title).toBe(planTitle);

      await authenticateWorkspacePage(page, context.email);
      await page.goto(`/app/care-plans/${planId}`, { waitUntil: 'commit' });

      // The status pill is the span rendered immediately after the title h1.
      const statusBadge = page.locator(
        '[data-testid="care-plan-title"] + span',
      );

      await expect(page.getByTestId('care-plan-title')).toHaveText(planTitle, {
        timeout: 30_000,
      });
      await expect(statusBadge).toHaveText('draft');

      // draft → active, driven by the page's own transition form.
      await page.getByRole('button', { name: 'Activate' }).click();
      await page.waitForURL(`**/app/care-plans/${planId}`, {
        waitUntil: 'commit',
      });

      await expect
        .poll(
          async () => {
            const { data } = await context.admin
              .from('org_care_plans')
              .select('status')
              .eq('organization_id', context.orgId)
              .eq('id', planId!)
              .maybeSingle();
            return (data as { status?: string } | null)?.status;
          },
          { timeout: 30_000 },
        )
        .toBe('active');

      // updateCarePlanStatus logs the transition with `required: true`, so a
      // silent audit-trail regression fails here rather than shipping green.
      await expect
        .poll(
          async () => {
            const { data } = await context.admin
              .from('org_audit_logs')
              .select('action, entity_type, entity_id')
              .eq('organization_id', context.orgId)
              .eq('entity_id', planId!)
              .eq('action', 'CARE_PLAN_STATUS_CHANGED')
              .limit(1);
            return (data ?? []).length;
          },
          { timeout: 30_000 },
        )
        .toBeGreaterThan(0);

      await expect(statusBadge).toHaveText('active', { timeout: 30_000 });

      // active → review, the transition that makes the plan "review due".
      await page.getByRole('button', { name: 'Mark for Review' }).click();
      await page.waitForURL(`**/app/care-plans/${planId}`, {
        waitUntil: 'commit',
      });

      await expect
        .poll(
          async () => {
            const { data } = await context.admin
              .from('org_care_plans')
              .select('status')
              .eq('organization_id', context.orgId)
              .eq('id', planId!)
              .maybeSingle();
            return (data as { status?: string } | null)?.status;
          },
          { timeout: 30_000 },
        )
        .toBe('review');

      await expect(statusBadge).toHaveText('review', { timeout: 30_000 });

      // The transition must also be visible through the member's own RLS
      // context, not just to the service-role client.
      const { data: rlsAfter, error: rlsAfterError } = await context.anon
        .from('org_care_plans')
        .select('status')
        .eq('id', planId)
        .maybeSingle();
      expect(rlsAfterError).toBeNull();
      expect((rlsAfter as { status?: string } | null)?.status).toBe('review');
    } finally {
      if (planId) {
        await context.admin
          .from('org_audit_logs')
          .delete()
          .eq('organization_id', context.orgId)
          .eq('entity_id', planId);
        await context.admin
          .from('org_care_plans')
          .delete()
          .eq('organization_id', context.orgId)
          .eq('id', planId);
      }
      await context.admin
        .from('org_patients')
        .delete()
        .eq('organization_id', context.orgId)
        .eq('id', participantId);
    }
  });
});
