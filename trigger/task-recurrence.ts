import { schedules } from '@trigger.dev/sdk/v3';
import { processRecurringTasks } from '@/lib/tasks/recurrence-engine';

export const taskRecurrenceTask = schedules.task({
  id: 'task-recurrence-daily',
  cron: '0 6 * * *', // Daily at 6 AM UTC
  run: async () => {
    const result = await processRecurringTasks();
    return { message: `Created ${result.created} recurring task instances` };
  },
});
