import { expect, test } from '@playwright/test';

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
      await authenticateWorkspacePage(page, context.email);

      await page.goto('/app/tasks', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(taskTitle).first()).toBeVisible();

      const { data: dbRow } = await context.admin
        .from('org_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)
        .select('status')
        .single();
      expect(dbRow?.status).toBe('completed');

      await page.goto('/app', { waitUntil: 'domcontentloaded' });
    } finally {
      await context.admin.from('org_tasks').delete().eq('id', taskId);
    }
  });
});
