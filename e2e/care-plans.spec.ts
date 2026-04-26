import { expect, test } from '@playwright/test';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedParticipant,
} from './helpers/workspace-seed';

test.describe('Care plans end-to-end', () => {
  test('create plan, add goal, add support, update status, persistence', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();
    const unique = Date.now();

    const participant = await seedParticipant(context, {
      fullName: `E2E Care Plan Client ${unique}`,
      externalId: `E2E-CP-${unique}`,
      careStatus: 'active',
      riskLevel: 'medium',
    });
    const participantId = (participant as { id?: string }).id;
    expect(participantId).toBeTruthy();

    const nowIso = new Date().toISOString();
    const { data: planRow, error: planError } = await context.admin
      .from('org_care_plans')
      .insert({
        organization_id: context.orgId,
        client_id: participantId,
        plan_type: 'support',
        title: `E2E Care Plan ${unique}`,
        description: 'Seeded for care plans e2e test',
        start_date: nowIso.slice(0, 10),
        status: 'draft',
        goals: [],
        supports: [],
        created_by: context.userId,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single();

    expect(planError).toBeNull();
    const planId = (planRow as { id?: string } | null)?.id;
    expect(planId).toBeTruthy();

    try {
      await authenticateWorkspacePage(page, context.email);

      await page.goto(`/app/care-plans/${planId}`, {
        waitUntil: 'domcontentloaded',
      });

      // Dismiss cookie consent dialog if present (intercepts clicks otherwise)
      try {
        await page
          .locator('button', { hasText: /Accept all/i })
          .first()
          .click({ timeout: 1500 });
      } catch {
        /* not present */
      }

      await expect(page.getByTestId('care-plan-title')).toHaveText(
        `E2E Care Plan ${unique}`,
      );
      await expect(page.getByTestId('care-plan-overview')).toBeVisible();
      await expect(page.getByTestId('care-plan-goals')).toBeVisible();
      await expect(page.getByTestId('care-plan-progress')).toBeVisible();

      // Add a goal via the form
      const addGoalForm = page.getByTestId('add-goal-form');
      await addGoalForm
        .locator('input[name="title"]')
        .fill(`E2E Goal ${unique}`);
      await addGoalForm
        .locator('textarea[name="description"]')
        .fill('Maintain independence');
      await addGoalForm.getByTestId('submit-goal').click();

      // Server action persisted — wait for DB state before reloading, since
      // parallel E2E workers can make a fixed sleep race the mutation.
      await expect
        .poll(
          async () => {
            const { data } = await context.admin
              .from('org_care_plans')
              .select('goals')
              .eq('id', planId)
              .maybeSingle();
            const goals = Array.isArray(data?.goals) ? data.goals : [];
            return goals.some(
              (goal: { title?: string }) =>
                goal.title === `E2E Goal ${unique}`,
            );
          },
          { timeout: 15_000 },
        )
        .toBe(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('care-plan-goal').first()).toBeVisible();
      await expect(page.getByText(`E2E Goal ${unique}`)).toBeVisible();

      // Edit the goal: rename + update description + set target date
      const goalRowForEdit = page.getByTestId('care-plan-goal').first();
      await goalRowForEdit.getByTestId('edit-goal-details').locator('summary').click();
      const editGoalForm = goalRowForEdit.getByTestId('edit-goal-form');
      await expect(editGoalForm).toBeVisible();
      await editGoalForm
        .locator('input[name="title"]')
        .fill(`E2E Goal Renamed ${unique}`);
      await editGoalForm
        .locator('textarea[name="description"]')
        .fill('Edited description — revised');
      await editGoalForm
        .locator('input[name="target_date"]')
        .fill('2027-01-15');
      await editGoalForm.getByTestId('save-goal-edit').click();

      await page.waitForTimeout(500);
      await page.reload({ waitUntil: 'domcontentloaded' });
      // Assert against paragraphs to avoid matching the edit-form's
      // textarea/input which still hold the same values as defaultValue
      await expect(
        page.locator('p', { hasText: `E2E Goal Renamed ${unique}` }).first(),
      ).toBeVisible();
      await expect(
        page
          .locator('p', { hasText: 'Edited description — revised' })
          .first(),
      ).toBeVisible();

      // Add a support nested under the goal
      const supportForm = page.getByTestId('add-support-form').first();
      await expect(supportForm).toBeVisible();
      await expect(
        supportForm.locator('input[name="description"]'),
      ).toBeEditable();
      await supportForm
        .locator('input[name="description"]')
        .fill(`E2E Support ${unique}`);
      await supportForm
        .locator('input[name="assigned_to"]')
        .fill('Staff lead');
      await supportForm
        .locator('input[name="frequency"]')
        .fill('Daily');
      await supportForm.locator('button[type="submit"]').click();

      // Server action persisted — wait for DB state before reloading, since
      // parallel E2E workers can make a fixed sleep race the mutation.
      await expect
        .poll(
          async () => {
            const { data } = await context.admin
              .from('org_care_plans')
              .select('supports')
              .eq('id', planId)
              .maybeSingle();
            const supports = Array.isArray(data?.supports)
              ? data.supports
              : [];
            return supports.some(
              (support: { description?: string }) =>
                support.description === `E2E Support ${unique}`,
            );
          },
          { timeout: 15_000 },
        )
        .toBe(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByText(`E2E Support ${unique}`)).toBeVisible();

      // Change goal status to "achieved" — scope to the goal-status form
      // (the form with goal_id hidden input, distinguishing it from support forms)
      const goalRow = page.getByTestId('care-plan-goal').first();
      const goalStatusForm = goalRow
        .locator('form')
        .filter({ has: page.locator('input[name="goal_id"]') })
        .filter({ has: page.locator('select[name="status"]') })
        .first();
      await goalStatusForm.locator('select[name="status"]').selectOption('achieved');
      await goalStatusForm.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Plan progress should derive from goal progress → 100%
      await expect(page.getByTestId('plan-progress-value')).toHaveText('100%');

      // Reload — verify persistence (renamed goal, description, support, progress)
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(
        page.locator('p', { hasText: `E2E Goal Renamed ${unique}` }).first(),
      ).toBeVisible();
      await expect(
        page
          .locator('p', { hasText: 'Edited description — revised' })
          .first(),
      ).toBeVisible();
      await expect(page.getByText(`E2E Support ${unique}`)).toBeVisible();
      await expect(page.getByTestId('plan-progress-value')).toHaveText('100%');

      // No 404 or unhandled error on the page
      expect(page.url()).toContain(`/app/care-plans/${planId}`);

      // Cross-module: participant page lists the plan
      await page.goto(`/app/participants/${participantId}`, {
        waitUntil: 'domcontentloaded',
      });
      const carePlansSection = page.getByTestId('participant-care-plans').first();
      await expect(carePlansSection).toBeVisible();
      await expect(
        carePlansSection.getByText(`E2E Care Plan ${unique}`),
      ).toBeVisible();
    } finally {
      if (planId) {
        await context.admin.from('org_care_plans').delete().eq('id', planId);
      }
      if (participantId) {
        await context.admin
          .from('org_patients')
          .delete()
          .eq('id', participantId);
      }
    }
  });
});
