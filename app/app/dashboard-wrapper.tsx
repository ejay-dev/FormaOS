'use client';

import { UnifiedDashboardLayout } from '@/components/dashboard/unified-dashboard-layout';
import { CommandCenter } from '@/components/dashboard/command-center';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
import { DashboardUpgradeNudge } from '@/components/billing/UsageLimitWarnings';
import { StartHereCard } from '@/components/onboarding/StartHereCard';
import { DatabaseRole, isEmployerRole } from '@/lib/roles';
import type { FirstSessionState } from '@/lib/onboarding/first-session';

interface DashboardWrapperProps {
  orgId: string;
  orgName: string;
  userRole: DatabaseRole;
  userEmail: string;
  industry?: string | null;
  teamMemberCount?: number;
  expiringCertsCount?: number;
  firstSession?: FirstSessionState | null;
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
  firstSession = null,
}: DashboardWrapperProps) {
  const isEmployer = isEmployerRole(userRole);
  const showStartHere = Boolean(firstSession?.isFirstSession);

  if (isEmployer) {
    return (
      <UnifiedDashboardLayout userRole={userRole} organizationName={orgName}>
        <DashboardUpgradeNudge />
        {showStartHere && firstSession ? (
          <div className="mb-6">
            <StartHereCard state={firstSession} />
          </div>
        ) : null}
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
      {showStartHere && firstSession ? (
        <div className="mb-6">
          <StartHereCard state={firstSession} />
        </div>
      ) : null}
      <EmployeeDashboard
        employeeName={userEmail || 'Employee'}
        organizationName={orgName}
        userRole={userRole}
        industry={industry}
      />
    </UnifiedDashboardLayout>
  );
}
