import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UnifiedDashboardLayout } from '@/components/dashboard/unified-dashboard-layout';
import { EmployerDashboard } from '@/components/dashboard/employer-dashboard';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
import { isEmployerRole, type DatabaseRole } from '@/lib/roles';
import { ShieldCheck } from 'lucide-react';

/**
 * =========================================================
 * UNIFIED DASHBOARD WITH ROLE-BASED RENDERING
 * Route: /app
 * =========================================================
 *
 * Single entry point that detects user role and renders:
 * - EmployerDashboard for owner/admin roles (org-wide view)
 * - EmployeeDashboard for member/viewer roles (personal view)
 *
 * No redirects - single /app route serves all users appropriately.
 */

type MembershipRow = {
  organization_id: string;
  role?: string | null;
  organizations?: { name?: string | null } | { name?: string | null }[] | null;
};

function safeOrgName(membership?: MembershipRow | null) {
  const orgs = membership?.organizations as any;
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
    <div className="flex flex-col items-center justify-center gap-3 text-center rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-12">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          {icon}
        </div>
      ) : null}
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="max-w-md text-xs leading-5 text-slate-400">
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
        icon={<ShieldCheck className="h-5 w-5 text-slate-300" />}
      />
    );
  }

  // Fetch user's organization membership and role
  let membership: MembershipRow | null = null;

  try {
    const { data } = await supabase
      .from('org_members')
      .select('organization_id, role, organizations(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    membership = (data as any) || null;
  } catch {
    membership = null;
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

  // ✅ UNIFIED DASHBOARD: Detect employer vs employee role
  const isEmployer = isEmployerRole(userRole);

  // Route to appropriate dashboard based on role
  if (isEmployer) {
    // Employer dashboard (owner/admin roles) - org-wide view
    return (
      <UnifiedDashboardLayout userRole={userRole} organizationName={orgName}>
        <EmployerDashboard organizationId={orgId} organizationName={orgName} />
      </UnifiedDashboardLayout>
    );
  } else {
    // Employee dashboard (member/viewer roles) - personal view
    return (
      <UnifiedDashboardLayout userRole={userRole} organizationName={orgName}>
        <EmployeeDashboard
          employeeName={user.email || 'Employee'}
          organizationName={orgName}
        />
      </UnifiedDashboardLayout>
    );
  }
}
