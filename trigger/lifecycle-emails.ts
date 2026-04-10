import { schedules } from '@trigger.dev/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Scheduled lifecycle email jobs.
 *
 * Runs daily at 9 AM UTC to check organisations against
 * time-based triggers and queue appropriate emails.
 */

interface OrgRow {
  id: string;
  name: string;
  created_at: string;
  industry?: string;
}

interface MemberRow {
  user_id: string;
  role: string;
}

interface SubRow {
  status: string;
  trial_expires_at: string | null;
}

function _daysSince(dateStr: string): number {
  const created = new Date(dateStr);
  const now = new Date();
  return Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
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

async function getOrgOwnerEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
): Promise<string | null> {
  const { data: members } = await admin
    .from('org_members')
    .select('user_id, role')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .limit(1);

  const owner = (members as MemberRow[] | null)?.[0];
  return owner?.user_id ?? null;
}

async function getOrgStats(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
) {
  const [obligations, evidence, members] = await Promise.all([
    admin
      .from('org_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ]);

  return {
    obligationsCount: obligations.count ?? 0,
    evidenceCount: evidence.count ?? 0,
    membersCount: members.count ?? 0,
  };
}

// ============================================================
// Day 3 Activation Nudge
// ============================================================
export const day3ActivationNudgeTask = schedules.task({
  id: 'lifecycle-day3-activation-nudge',
  cron: '0 9 * * *', // 9 AM UTC daily
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    // Find orgs created ~3 days ago with no frameworks activated
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at, industry')
      .gte('created_at', fourDaysAgo.toISOString())
      .lte('created_at', threeDaysAgo.toISOString());

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      // Check if frameworks are activated (any tasks = framework activated)
      const { count } = await admin
        .from('org_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      if ((count ?? 0) > 0) continue; // Already has frameworks

      const ownerUserId = await getOrgOwnerEmail(admin, org.id);
      if (!ownerUserId) continue;

      await queueEmail(
        admin,
        ownerUserId,
        "You haven't activated a framework yet",
        'activation_nudge',
        {
          orgId: org.id,
          orgName: org.name,
          industry: org.industry ?? 'your industry',
        },
      );
      queued++;
    }

    return { ok: true, queued };
  },
});

// ============================================================
// Day 7 Progress Email
// ============================================================
export const day7ProgressTask = schedules.task({
  id: 'lifecycle-day7-progress',
  cron: '0 9 * * *',
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .gte('created_at', eightDaysAgo.toISOString())
      .lte('created_at', sevenDaysAgo.toISOString());

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      const ownerUserId = await getOrgOwnerEmail(admin, org.id);
      if (!ownerUserId) continue;

      const stats = await getOrgStats(admin, org.id);

      await queueEmail(
        admin,
        ownerUserId,
        "Week 1 with FormaOS — here's your progress",
        'day7_progress',
        {
          orgId: org.id,
          ...stats,
        },
      );
      queued++;
    }

    return { ok: true, queued };
  },
});

// ============================================================
// Day 11 Trial Expiring Warning
// ============================================================
export const day11TrialWarningTask = schedules.task({
  id: 'lifecycle-day11-trial-warning',
  cron: '0 9 * * *',
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const elevenDaysAgo = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);
    const twelveDaysAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .gte('created_at', twelveDaysAgo.toISOString())
      .lte('created_at', elevenDaysAgo.toISOString());

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      // Check if still on trial
      const { data: sub } = await admin
        .from('org_subscriptions')
        .select('status, trial_expires_at')
        .eq('organization_id', org.id)
        .maybeSingle();

      const subscription = sub as SubRow | null;
      if (!subscription || subscription.status !== 'trialing') continue;

      const ownerUserId = await getOrgOwnerEmail(admin, org.id);
      if (!ownerUserId) continue;

      const stats = await getOrgStats(admin, org.id);

      await queueEmail(
        admin,
        ownerUserId,
        'Your FormaOS trial ends in 3 days',
        'trial_expiring',
        {
          orgId: org.id,
          daysRemaining: 3,
          ...stats,
        },
      );
      queued++;
    }

    return { ok: true, queued };
  },
});

// ============================================================
// Day 13 Trial Final Warning
// ============================================================
export const day13FinalWarningTask = schedules.task({
  id: 'lifecycle-day13-final-warning',
  cron: '0 9 * * *',
  run: async () => {
    const admin = createSupabaseAdminClient();
    let queued = 0;

    const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lte('created_at', thirteenDaysAgo.toISOString());

    for (const org of (orgs as OrgRow[] | null) ?? []) {
      const { data: sub } = await admin
        .from('org_subscriptions')
        .select('status, trial_expires_at')
        .eq('organization_id', org.id)
        .maybeSingle();

      const subscription = sub as SubRow | null;
      if (!subscription || subscription.status !== 'trialing') continue;

      const ownerUserId = await getOrgOwnerEmail(admin, org.id);
      if (!ownerUserId) continue;

      const stats = await getOrgStats(admin, org.id);

      await queueEmail(
        admin,
        ownerUserId,
        "Last day of your FormaOS trial — don't lose your work",
        'trial_final_warning',
        {
          orgId: org.id,
          ...stats,
        },
      );
      queued++;
    }

    return { ok: true, queued };
  },
});
