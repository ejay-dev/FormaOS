import { render, screen } from '@testing-library/react';

import { DashboardWrapper } from '@/app/app/dashboard-wrapper';

jest.mock('@/components/dashboard/unified-dashboard-layout', () => ({
  UnifiedDashboardLayout: ({
    children,
    userRole,
    organizationName,
  }: {
    children: React.ReactNode;
    userRole: string;
    organizationName: string;
  }) => (
    <div
      data-testid="dashboard-layout"
      data-role={userRole}
      data-org={organizationName}
    >
      {children}
    </div>
  ),
}));

jest.mock('@/components/dashboard/employer-dashboard', () => ({
  EmployerDashboard: ({
    organizationId,
    organizationName,
    industry,
  }: {
    organizationId: string;
    organizationName: string;
    industry?: string | null;
  }) => (
    <div data-testid="employer-dashboard">
      {organizationId}:{organizationName}:{industry ?? 'none'}
    </div>
  ),
}));

jest.mock('@/components/dashboard/employee-dashboard', () => ({
  EmployeeDashboard: ({
    employeeName,
    organizationName,
    userRole,
    industry,
  }: {
    employeeName: string;
    organizationName: string;
    userRole: string;
    industry?: string | null;
  }) => (
    <div data-testid="employee-dashboard">
      {employeeName}:{organizationName}:{userRole}:{industry ?? 'none'}
    </div>
  ),
}));

describe('DashboardWrapper', () => {
  it('renders the employer dashboard for owner and admin roles', () => {
    const { rerender } = render(
      <DashboardWrapper
        orgId="org-owner"
        orgName="Forma Owner"
        userRole="owner"
        userEmail="owner@example.com"
        industry="healthcare"
      />,
    );

    expect(screen.getByTestId('dashboard-layout')).toHaveAttribute(
      'data-role',
      'owner',
    );
    expect(screen.getByTestId('employer-dashboard')).toHaveTextContent(
      'org-owner:Forma Owner:healthcare',
    );
    expect(screen.queryByTestId('employee-dashboard')).not.toBeInTheDocument();

    rerender(
      <DashboardWrapper
        orgId="org-admin"
        orgName="Forma Admin"
        userRole="admin"
        userEmail="admin@example.com"
        industry="enterprise"
      />,
    );

    expect(screen.getByTestId('dashboard-layout')).toHaveAttribute(
      'data-role',
      'admin',
    );
    expect(screen.getByTestId('employer-dashboard')).toHaveTextContent(
      'org-admin:Forma Admin:enterprise',
    );
  });

  it('renders the employee dashboard for member and viewer roles', () => {
    const { rerender } = render(
      <DashboardWrapper
        orgId="org-member"
        orgName="Forma Member"
        userRole="member"
        userEmail="member@example.com"
        industry="healthcare"
      />,
    );

    expect(screen.getByTestId('dashboard-layout')).toHaveAttribute(
      'data-role',
      'member',
    );
    expect(screen.getByTestId('employee-dashboard')).toHaveTextContent(
      'member@example.com:Forma Member:member:healthcare',
    );
    expect(screen.queryByTestId('employer-dashboard')).not.toBeInTheDocument();

    rerender(
      <DashboardWrapper
        orgId="org-viewer"
        orgName="Forma Viewer"
        userRole="viewer"
        userEmail=""
        industry="enterprise"
      />,
    );

    expect(screen.getByTestId('dashboard-layout')).toHaveAttribute(
      'data-role',
      'viewer',
    );
    expect(screen.getByTestId('employee-dashboard')).toHaveTextContent(
      'Employee:Forma Viewer:viewer:enterprise',
    );
  });
});
