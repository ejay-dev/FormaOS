'use client';

import { UnifiedDashboardLayout } from '@/components/dashboard/unified-dashboard-layout';
import { CommandCenter } from '@/components/dashboard/command-center';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
import { DashboardUpgradeNudge } from '@/components/billing/UsageLimitWarnings';
import { DatabaseRole, isEmployerRole } from '@/lib/roles';

interface DashboardWrapperProps {
  orgId: string;
  orgName: string;
  userRole: DatabaseRole;
  userEmail: string;
  industry?: string | null;
  teamMemberCount?: number;
  expiringCertsCount?: number;
}

/**
 * Client-side wrapper that renders the appropriate dashboard
 * based on user role. Receives pre-fetched data from server.
 */
export function DashboardWrapper({
  orgId,
  orgName,
  userRole,
  userEmail,
  industry,
  teamMemberCount = 0,
  expiringCertsCount = 0,
}: DashboardWrapperProps) {
  const isEmployer = isEmployerRole(userRole);

  if (isEmployer) {
    return (
      <UnifiedDashboardLayout userRole={userRole} organizationName={orgName}>
        <DashboardUpgradeNudge />
        <CommandCenter
          organizationId={orgId}
          organizationName={orgName}
          industry={industry}
          userEmail={userEmail}
          teamMemberCount={teamMemberCount}
          expiringCertsCount={expiringCertsCount}
        />
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout userRole={userRole} organizationName={orgName}>
      <DashboardUpgradeNudge />
      <EmployeeDashboard
        employeeName={userEmail || 'Employee'}
        organizationName={orgName}
        userRole={userRole}
        industry={industry}
      />
    </UnifiedDashboardLayout>
  );
}
