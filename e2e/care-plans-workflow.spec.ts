import { expect, test } from '@playwright/test';

import { getWorkspaceSeedContext } from './helpers/workspace-seed';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test.describe('Care plans workflow', () => {
  test('tracks care plan lifecycle states from draft to review due', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();
    const unique = Date.now();
    const participantName = `E2E Patient ${unique}`;
    const planTitle = `E2E Care Plan ${unique}`;

    const { data: participant, error: participantError } = await context.admin
      .from('org_patients')
      .insert({
        organization_id: context.orgId,
        full_name: participantName,
        care_status: 'active',
        risk_level: 'low',
        created_by: context.userId,
      })
      .select('id')
      .single();

    expect(participantError).toBeNull();
    const participantId = participant?.id as string;
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

      const { data: draftRead, error: draftReadError } = await context.admin
        .from('org_care_plans')
        .select('id, status, review_date, title')
        .eq('organization_id', context.orgId)
        .eq('id', planId)
        .single();
      expect(draftReadError).toBeNull();
      expect(draftRead?.status).toBe('draft');
      expect(draftRead?.title).toBe(planTitle);

      const { error: activateError } = await context.admin
        .from('org_care_plans')
        .update({
          status: 'active',
          review_date: isoDateOffset(-2),
        })
        .eq('organization_id', context.orgId)
        .eq('id', planId);
      expect(activateError).toBeNull();

      const { data: activeRead, error: activeReadError } = await context.admin
        .from('org_care_plans')
        .select('id, status, review_date')
        .eq('organization_id', context.orgId)
        .eq('id', planId)
        .single();
      expect(activeReadError).toBeNull();
      expect(activeRead?.status).toBe('active');
      expect(activeRead?.review_date).toBe(isoDateOffset(-2));

      const { error: reviewTransitionError } = await context.admin
        .from('org_care_plans')
        .update({
          status: 'under_review',
        })
        .eq('organization_id', context.orgId)
        .eq('id', planId);
      expect(reviewTransitionError).toBeNull();

      const { data: reviewRead, error: reviewReadError } = await context.admin
        .from('org_care_plans')
        .select('id, status')
        .eq('organization_id', context.orgId)
        .eq('id', planId)
        .single();
      expect(reviewReadError).toBeNull();
      expect(reviewRead?.status).toBe('under_review');
    } finally {
      if (planId) {
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
