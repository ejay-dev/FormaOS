import { schedules } from '@trigger.dev/sdk/v3';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Daily check for policies approaching their review date
export const policyReviewReminder = schedules.task({
  id: 'policy-review-reminder',
  cron: '0 7 * * *', // 7 AM daily
  run: async () => {
    const db = createSupabaseAdminClient();

    // Get all policies due for review in the next 14 days
    const fourteenDaysOut = new Date();
    fourteenDaysOut.setDate(fourteenDaysOut.getDate() + 14);
    const cutoff = fourteenDaysOut.toISOString().split('T')[0];

    const { data: dueSchedules } = await db
      .from('policy_review_schedules')
      .select('id, org_id, policy_id, next_review_date, reviewer_ids')
      .lte('next_review_date', cutoff)
      .order('next_review_date');

    if (!dueSchedules || dueSchedules.length === 0) return { processed: 0 };

    // Create tasks for each policy needing review
    for (const schedule of dueSchedules) {
      // Get the policy title from the latest published version
      const { data: latestVersion } = await db
        .from('policy_versions')
        .select('title')
        .eq('policy_id', schedule.policy_id)
        .eq('org_id', schedule.org_id)
        .eq('status', 'published')
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (!latestVersion) continue;

      // Check if a review task already exists for this cycle
      const { data: existing } = await db
        .from('org_tasks')
        .select('id')
        .eq('org_id', schedule.org_id)
        .ilike('title', `%Review: ${latestVersion.title}%`)
        .eq('status', 'to_do');

      if (existing && existing.length > 0) continue;

      // Create a review task
      await db.from('org_tasks').insert({
        org_id: schedule.org_id,
        title: `Policy Review: ${latestVersion.title}`,
        description: `Scheduled review due ${schedule.next_review_date}. Review and update this policy to ensure accuracy and compliance.`,
        status: 'to_do',
        priority: 'high',
        due_date: schedule.next_review_date,
        created_by: schedule.reviewer_ids?.[0] || null,
        assigned_to: schedule.reviewer_ids?.[0] || null,
      });
    }

    return { processed: dueSchedules.length };
  },
});
