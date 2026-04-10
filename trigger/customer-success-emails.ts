import { schedules } from '@trigger.dev/sdk/v3';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * =========================================================
 * Customer Success Emails – 6 Behaviour-Triggered Jobs
 * =========================================================
 * Daily cron checks for org-level behavioural milestones
 * and queues personalised success emails to org owners.
 *
 * 1. First Control Satisfied    – congrats + next steps
 * 2. First Evidence Uploaded    – momentum reinforcement
 * 3. Team Growth (3+ members)   – collaboration tips
 * 4. Compliance Score 50%+      – halfway celebration
 * 5. Compliance Score 90%+      – near-complete congrats
 * 6. 30-Day Engagement Recap    – monthly value summary
 */

interface OrgRow {
  id: string;
  name: string;
  created_at: string;
}

async function queueEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  to: string,
  subject: string,
  template: string,
  data: Record<string, unknown>,
) {
  await admin.from('email_queue').insert({
    to,
    subject,
    template,
    data,
  });
}

async function getOwnerEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
): Promise<string | null> {
  const { data: members } = await admin
    .from('org_members')
    .select('user_id, role')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .limit(1);

  const owner = (
    members as Array<{ user_id: string; role: string }> | null
  )?.[0];
  if (!owner) return null;

  const { data } = await admin.auth.admin.getUserById(owner.user_id);
  return data?.user?.email ?? null;
}

async function hasBeenSent(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  template: string,
): Promise<boolean> {
  const { count } = await admin
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('data->>org_id', orgId)
    .eq('template', template);
  return (count ?? 0) > 0;
}

// ============================================================
// 1. First Control Satisfied
// ============================================================
export const firstControlSatisfiedTask = schedules.task({
  id: 'success-first-control-satisfied',
  cron: '0 10 * * *', // 10 AM UTC daily
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .eq('lifecycle_status', 'active');

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      if (await hasBeenSent(admin, org.id, 'success-first-control')) continue;

      const { count } = await admin
        .from('org_controls')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'satisfied');

      if ((count ?? 0) === 0) continue;

      const email = await getOwnerEmail(admin, org.id);
      if (!email) continue;

      await queueEmail(
        admin,
        email,
        `${org.name}: First compliance control satisfied!`,
        'success-first-control',
        {
          org_id: org.id,
          org_name: org.name,
          satisfied_count: count,
        },
      );
      queued++;
    }

    return { job: 'first-control-satisfied', queued };
  },
});

// ============================================================
// 2. First Evidence Uploaded
// ============================================================
export const firstEvidenceUploadedTask = schedules.task({
  id: 'success-first-evidence-uploaded',
  cron: '0 10 * * *',
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .eq('lifecycle_status', 'active');

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      if (await hasBeenSent(admin, org.id, 'success-first-evidence')) continue;

      const { count } = await admin
        .from('org_evidence')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      if ((count ?? 0) === 0) continue;

      const email = await getOwnerEmail(admin, org.id);
      if (!email) continue;

      await queueEmail(
        admin,
        email,
        `${org.name}: Evidence collection is underway!`,
        'success-first-evidence',
        {
          org_id: org.id,
          org_name: org.name,
          evidence_count: count,
        },
      );
      queued++;
    }

    return { job: 'first-evidence-uploaded', queued };
  },
});

// ============================================================
// 3. Team Growth (3+ members)
// ============================================================
export const teamGrowthMilestoneTask = schedules.task({
  id: 'success-team-growth-milestone',
  cron: '0 10 * * *',
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .eq('lifecycle_status', 'active');

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      if (await hasBeenSent(admin, org.id, 'success-team-growth')) continue;

      const { count } = await admin
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      if ((count ?? 0) < 3) continue;

      const email = await getOwnerEmail(admin, org.id);
      if (!email) continue;

      await queueEmail(
        admin,
        email,
        `${org.name}: Your compliance team is growing!`,
        'success-team-growth',
        {
          org_id: org.id,
          org_name: org.name,
          member_count: count,
        },
      );
      queued++;
    }

    return { job: 'team-growth-milestone', queued };
  },
});

// ============================================================
// 4. Compliance Score 50%+ (Halfway)
// ============================================================
export const complianceHalfwayTask = schedules.task({
  id: 'success-compliance-halfway',
  cron: '0 10 * * *',
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .eq('lifecycle_status', 'active');

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      if (await hasBeenSent(admin, org.id, 'success-compliance-halfway'))
        continue;

      const { data: controls } = await admin
        .from('org_controls')
        .select('status')
        .eq('organization_id', org.id);

      const total = controls?.length ?? 0;
      if (total === 0) continue;

      const satisfied = controls!.filter(
        (c) => c.status === 'satisfied',
      ).length;
      const score = Math.round((satisfied / total) * 100);

      if (score < 50) continue;

      const email = await getOwnerEmail(admin, org.id);
      if (!email) continue;

      await queueEmail(
        admin,
        email,
        `${org.name}: 50% compliance reached!`,
        'success-compliance-halfway',
        {
          org_id: org.id,
          org_name: org.name,
          compliance_score: score,
          satisfied_controls: satisfied,
          total_controls: total,
        },
      );
      queued++;
    }

    return { job: 'compliance-halfway', queued };
  },
});

// ============================================================
// 5. Compliance Score 90%+ (Near Complete)
// ============================================================
export const complianceNearCompleteTask = schedules.task({
  id: 'success-compliance-near-complete',
  cron: '0 10 * * *',
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .eq('lifecycle_status', 'active');

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      if (await hasBeenSent(admin, org.id, 'success-compliance-near-complete'))
        continue;

      const { data: controls } = await admin
        .from('org_controls')
        .select('status')
        .eq('organization_id', org.id);

      const total = controls?.length ?? 0;
      if (total === 0) continue;

      const satisfied = controls!.filter(
        (c) => c.status === 'satisfied',
      ).length;
      const score = Math.round((satisfied / total) * 100);

      if (score < 90) continue;

      const email = await getOwnerEmail(admin, org.id);
      if (!email) continue;

      await queueEmail(
        admin,
        email,
        `${org.name}: 90% compliance — almost there!`,
        'success-compliance-near-complete',
        {
          org_id: org.id,
          org_name: org.name,
          compliance_score: score,
          remaining_controls: total - satisfied,
        },
      );
      queued++;
    }

    return { job: 'compliance-near-complete', queued };
  },
});

// ============================================================
// 6. 30-Day Engagement Recap
// ============================================================
export const monthlyEngagementRecapTask = schedules.task({
  id: 'success-monthly-engagement-recap',
  cron: '0 10 1 * *', // 1st of each month
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .eq('lifecycle_status', 'active');

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      // Only send to orgs older than 30 days
      const ageMs = Date.now() - new Date(org.created_at).getTime();
      if (ageMs < 30 * 24 * 60 * 60 * 1000) continue;

      const [tasksResult, evidenceResult, controlsResult, membersResult] =
        await Promise.all([
          admin
            .from('org_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .eq('status', 'completed')
            .gte('updated_at', thirtyDaysAgo),
          admin
            .from('org_evidence')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .gte('created_at', thirtyDaysAgo),
          admin
            .from('org_controls')
            .select('status')
            .eq('organization_id', org.id),
          admin
            .from('org_members')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id),
        ]);

      const total = controlsResult.data?.length ?? 0;
      const satisfied =
        controlsResult.data?.filter((c) => c.status === 'satisfied').length ??
        0;

      const email = await getOwnerEmail(admin, org.id);
      if (!email) continue;

      await queueEmail(
        admin,
        email,
        `${org.name}: Your monthly compliance recap`,
        'success-monthly-recap',
        {
          org_id: org.id,
          org_name: org.name,
          tasks_completed: tasksResult.count ?? 0,
          evidence_uploaded: evidenceResult.count ?? 0,
          compliance_score:
            total > 0 ? Math.round((satisfied / total) * 100) : 0,
          team_size: membersResult.count ?? 0,
        },
      );
      queued++;
    }

    return { job: 'monthly-engagement-recap', queued };
  },
});
