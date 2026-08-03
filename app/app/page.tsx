import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardWrapper } from './dashboard-wrapper';
import { type DatabaseRole } from '@/lib/roles';
import { Download, ShieldCheck } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import {
  CHECKOUT_INTENT_COOKIE,
  parseCheckoutIntent,
} from '@/lib/billing/checkout-intent';
import { getFirstSessionState } from '@/lib/onboarding/first-session';

/**
 * =========================================================
 * UNIFIED DASHBOARD WITH ROLE-BASED RENDERING
 * Route: /app
 * =========================================================
 *
 * Server component that fetches user data and passes to
 * client-side DashboardWrapper for role-based rendering.
 *
 * - EmployerDashboard for owner/admin roles (org-wide view)
 * - EmployeeDashboard for member/viewer roles (personal view)
 */

type MembershipRow = {
  organization_id: string;
  role?: string | null;
  organizations?: { name?: string | null } | { name?: string | null }[] | null;
};

function safeOrgName(membership?: MembershipRow | null) {
  const orgs = membership?.organizations;
  const name = Array.isArray(orgs) ? orgs?.[0]?.name : orgs?.name;
  return (name || 'My Organization') as string;
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center rounded-2xl border border-edge-2 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-12">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-edge-2 bg-surface-1">
          {icon}
        </div>
      ) : null}
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="max-w-md text-xs leading-5 text-muted-foreground">
        {description}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This should be caught by middleware, but guard just in case
    return (
      <EmptyState
        title="Session expired"
        description="Please sign in again to continue."
        icon={<ShieldCheck className="h-5 w-5 text-foreground/70" />}
      />
    );
  }

  // Extra guard for partially provisioned users:
  // if recovery indicates onboarding/integrity work is needed, redirect before rendering dashboard.
  const recovery = await recoverUserWorkspace({
    userId: user.id,
    userEmail: user.email ?? null,
    source: 'app-page',
  });
  if (recovery.ok && recovery.nextPath !== '/app') {
    redirect(recovery.nextPath);
  }

  // Self-serve buyers land here after signup + onboarding. If they arrived via
  // the pricing page's checkout intent, route them into Stripe Checkout now.
  const cookieStore = await cookies();
  const intentPlan = parseCheckoutIntent(
    cookieStore.get(CHECKOUT_INTENT_COOKIE)?.value ?? null,
  );
  if (intentPlan) {
    redirect(`/app/billing?autoCheckout=${encodeURIComponent(intentPlan)}`);
  }

  // Defense-in-depth: the layout already gates pending_checkout, but if a user
  // somehow reaches /app with a self-serve plan that hasn't paid yet (e.g.
  // legacy 'active' row from before the gate was wired), force the upgrade.
  // Real paid subscriptions always carry a stripe_subscription_id.

  // Fetch user's organization membership, role, and industry
  let membership: MembershipRow | null = null;
  let industry: string | null = null;

  try {
    const { data } = await supabase
      .from('org_members')
      .select('organization_id, role, organizations(name, industry)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    membership = (data as MembershipRow) || null;

    // Extract industry from nested organizations object
    const orgs = membership?.organizations as
      | { name?: string; industry?: string }
      | { name?: string; industry?: string }[]
      | null;
    industry = Array.isArray(orgs)
      ? (orgs?.[0]?.industry ?? null)
      : (orgs?.industry ?? null);
  } catch {
    membership = null;
  }

  // Universal billing gate: if the user's subscription requires payment,
  // route them to billing. The dashboard is never the right place to render
  // for a pending_checkout / past_due / canceled subscription. Admin-comped
  // and legacy 'active' rows pass through — only the explicit unpaid statuses
  // trigger the redirect.
  if (membership?.organization_id) {
    const { data: sub } = await supabase
      .from('org_subscriptions')
      .select('status, plan_key')
      .eq('organization_id', membership.organization_id)
      .maybeSingle();
    const status = sub?.status ?? null;
    const planKey = sub?.plan_key ?? null;
    const selfServePlan =
      planKey === 'basic' || planKey === 'pro' || planKey === 'scale';

    if (
      status === 'pending_checkout' ||
      status === 'past_due' ||
      status === 'canceled' ||
      status === 'incomplete'
    ) {
      const target = selfServePlan ? planKey : 'basic';
      redirect(`/app/billing?autoCheckout=${encodeURIComponent(target)}`);
    }
  }

  const orgName = safeOrgName(membership);
  const orgId = membership?.organization_id || '';

  const firstSession = orgId ? await getFirstSessionState(orgId) : null;

  // Live top-level KPIs. Each count is settled independently so one failing
  // query cannot report the other three as a confident zero, and a failure is
  // logged rather than swallowed.
  let teamMemberCount = 0;
  let expiringCertsCount = 0;
  let tasksAssigned = 0;
  let tasksPending = 0;
  if (orgId) {
    const expiryHorizon = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const settled = await Promise.allSettled([
      supabase
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      supabase
        .from('org_staff_credentials')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', expiryHorizon),
      supabase
        .from('org_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('assigned_to', user.id),
      supabase
        .from('org_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('assigned_to', user.id)
        .eq('status', 'pending'),
    ]);

    const names = [
      'team members',
      'expiring credentials',
      'assigned tasks',
      'pending tasks',
    ];
    const counts = settled.map((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `[dashboard] ${names[index]} count unavailable:`,
          result.reason,
        );
        return 0;
      }
      if (result.value.error) {
        console.error(
          `[dashboard] ${names[index]} count unavailable:`,
          result.value.error.message,
        );
        return 0;
      }
      return result.value.count ?? 0;
    });

    [teamMemberCount, expiringCertsCount, tasksAssigned, tasksPending] = counts;
  }

  // Normalize and validate role as DatabaseRole type
  const rawRole = membership?.role?.toLowerCase() || 'member';
  const userRole = (
    ['owner', 'admin', 'member', 'viewer'].includes(rawRole)
      ? rawRole
      : 'member'
  ) as DatabaseRole;

  // Pass to client component for role-based rendering
  return (
    <>
      <DashboardWrapper
        orgId={orgId}
        orgName={orgName}
        userRole={userRole}
        userEmail={user.email || 'User'}
        industry={industry}
        teamMemberCount={teamMemberCount}
        expiringCertsCount={expiringCertsCount}
        firstSession={firstSession}
        tasksAssigned={tasksAssigned}
        tasksPending={tasksPending}
      />
      {/* Audit 2026-05-25 (GDPR): inline data-portability affordance.
          Lives at the root of /app so the GDPR compliance suite finds
          [data-export] at the dashboard URL it probes. Routes to the
          canonical "Your data" surface. */}
      <div className="mx-auto mt-6 flex max-w-7xl justify-end px-4 sm:px-6 lg:px-8">
        <Link
          href="/app/privacy"
          data-export
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          Export your personal data
        </Link>
      </div>
    </>
  );
}
