const isExplicitlyDisabled = (value: string | undefined): boolean =>
  value === '0' || value?.toLowerCase() === 'false';

export function isSecurityMonitoringEnabled(): boolean {
  return !isExplicitlyDisabled(process.env.SECURITY_MONITORING_ENABLED);
}

export function isSecurityDashboardEnabled(): boolean {
  return !isExplicitlyDisabled(
    process.env.SECURITY_MONITORING_DASHBOARD_ENABLED,
  );
}

export function isClientSecurityTrackingEnabled(): boolean {
  return !isExplicitlyDisabled(
    process.env.NEXT_PUBLIC_SECURITY_ACTIVITY_TRACKING,
  );
}
