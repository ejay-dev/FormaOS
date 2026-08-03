import { expect, test } from '@playwright/test';

import { waitForAppReady } from './helpers/fixtures';
import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedTask,
} from './helpers/workspace-seed';

test.describe('Task completion flow', () => {
  test('marking a task complete persists and reveals on dashboard', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();
    const unique = Date.now();
    const taskTitle = `E2E completion task ${unique}`;
    const seeded = await seedTask(context, {
      title: taskTitle,
      status: 'pending',
      priority: 'high',
    });
    const taskId = seeded.id as string;

    try {
      const { appBase } = await authenticateWorkspacePage(page, context.email);

      // Seed users can carry more than one membership; pin the active org so
      // the /api/v1 routes resolve context.orgId instead of answering 409
      // active_org_required.
      const activeOrgResponse = await page.request.post(
        `${appBase}/api/v1/account/active-organization`,
        {
          headers: { Origin: appBase },
          data: { organizationId: context.orgId },
        },
      );
      expect(activeOrgResponse.status()).toBe(200);

      await page.goto('/app/tasks', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(taskTitle).first()).toBeVisible();

      // Negative control: the task is not in the completed view yet, so the
      // post-completion assertion below cannot pass vacuously.
      await page.goto('/app/tasks?status=completed', {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByText(taskTitle)).toHaveCount(0);

      // Complete through the route the tasks UI actually calls. A direct
      // service-role UPDATE would bypass auth, org scoping and RLS — the
      // parts of the contract this test exists to protect.
      const completionResponse = await page.request.patch(
        `${appBase}/api/v1/tasks/${taskId}/status`,
        {
          headers: { Origin: appBase },
          data: { status: 'completed' },
        },
      );
      expect(completionResponse.status()).toBe(200);
      expect(await completionResponse.json()).toMatchObject({
        ok: true,
        status: 'completed',
      });

      const { data: dbRow, error: dbError } = await context.admin
        .from('org_tasks')
        .select('status, organization_id')
        .eq('id', taskId)
        .single();
      expect(dbError).toBeNull();
      expect(dbRow?.status).toBe('completed');
      expect(dbRow?.organization_id).toBe(context.orgId);

      // The completed task now surfaces in the completed view…
      await page.goto('/app/tasks?status=completed', {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByText(taskTitle).first()).toBeVisible();

      // …and the dashboard's open-actions feed (MyActionsWidget on /app)
      // must have dropped it.
      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page, { expectedPath: '/app' });
      await expect(page.locator('[data-export]').first()).toBeVisible();

      const myActionsResponse = await page.request.get(
        `${appBase}/api/v1/tasks/my-actions`,
      );
      expect(myActionsResponse.status()).toBe(200);
      const myActions = (await myActionsResponse.json()) as {
        actions: Array<{ id: string }>;
      };
      expect(Array.isArray(myActions.actions)).toBe(true);
      expect(myActions.actions.map((action) => action.id)).not.toContain(
        taskId,
      );
    } finally {
      await context.admin.from('org_tasks').delete().eq('id', taskId);
    }
  });
});
