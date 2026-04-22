import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardWrapper } from './dashboard-wrapper';
import { type DatabaseRole } from '@/lib/roles';
import { ShieldCheck } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import {
  CHECKOUT_INTENT_COOKIE,
  parseCheckoutIntent,
} from '@/lib/billing/checkout-intent';

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
    const orgs = membership?.organizations as { name?: string; industry?: string } | { name?: string; industry?: string }[] | null;
    industry = Array.isArray(orgs) ? orgs?.[0]?.industry ?? null : orgs?.industry ?? null;
  } catch {
    membership = null;
  }

  // Cookie-expiry recovery: a recent signup with a membership but no active
  // subscription is almost certainly a self-serve buyer whose checkout-intent
  // cookie expired (30-min TTL) mid-flow. Route them to billing with a resume
  // prompt instead of dropping them into an unprovisioned dashboard.
  const userCreatedAt = user.created_at ? Date.parse(user.created_at) : 0;
  const isRecentSignup =
    userCreatedAt > 0 && userCreatedAt > Date.now() - 24 * 60 * 60 * 1000;
  if (isRecentSignup && membership?.organization_id) {
    const { data: sub } = await supabase
      .from('org_subscriptions')
      .select('status')
      .eq('organization_id', membership.organization_id)
      .maybeSingle();
    const status = sub?.status ?? null;
    const isProvisioned = status === 'active' || status === 'trialing';
    if (!isProvisioned) {
      redirect('/app/billing?resumeCheckout=basic');
    }
  }

  const orgName = safeOrgName(membership);
  const orgId = membership?.organization_id || '';

  // Normalize and validate role as DatabaseRole type
  const rawRole = membership?.role?.toLowerCase() || 'member';
  const userRole = (
    ['owner', 'admin', 'member', 'viewer'].includes(rawRole)
      ? rawRole
      : 'member'
  ) as DatabaseRole;

  // Pass to client component for role-based rendering
  return (
    <DashboardWrapper
      orgId={orgId}
      orgName={orgName}
      userRole={userRole}
      userEmail={user.email || 'User'}
      industry={industry}
    />
  );
}
