/**
 * Tests for lib/security/monitoring-flags.ts
 * Pure env-var checks — no mocks needed besides env.
 */

import {
  isSecurityMonitoringEnabled,
  isSecurityDashboardEnabled,
  isClientSecurityTrackingEnabled,
} from '@/lib/security/monitoring-flags';

const ORIG_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIG_ENV };
});

afterAll(() => {
  process.env = ORIG_ENV;
});

describe('isSecurityMonitoringEnabled', () => {
  it('returns true when env not set', () => {
    delete process.env.SECURITY_MONITORING_ENABLED;
    expect(isSecurityMonitoringEnabled()).toBe(true);
  });

  it('returns true when set to "1"', () => {
    process.env.SECURITY_MONITORING_ENABLED = '1';
    expect(isSecurityMonitoringEnabled()).toBe(true);
  });

  it('returns false when set to "0"', () => {
    process.env.SECURITY_MONITORING_ENABLED = '0';
    expect(isSecurityMonitoringEnabled()).toBe(false);
  });

  it('returns false when set to "false"', () => {
    process.env.SECURITY_MONITORING_ENABLED = 'false';
    expect(isSecurityMonitoringEnabled()).toBe(false);
  });

  it('returns false when set to "FALSE"', () => {
    process.env.SECURITY_MONITORING_ENABLED = 'FALSE';
    expect(isSecurityMonitoringEnabled()).toBe(false);
  });
});

describe('isSecurityDashboardEnabled', () => {
  it('returns true when env not set', () => {
    delete process.env.SECURITY_MONITORING_DASHBOARD_ENABLED;
    expect(isSecurityDashboardEnabled()).toBe(true);
  });

  it('returns false when set to "0"', () => {
    process.env.SECURITY_MONITORING_DASHBOARD_ENABLED = '0';
    expect(isSecurityDashboardEnabled()).toBe(false);
  });

  it('returns false when set to "false"', () => {
    process.env.SECURITY_MONITORING_DASHBOARD_ENABLED = 'false';
    expect(isSecurityDashboardEnabled()).toBe(false);
  });
});

describe('isClientSecurityTrackingEnabled', () => {
  it('returns true when env not set', () => {
    delete process.env.NEXT_PUBLIC_SECURITY_ACTIVITY_TRACKING;
    expect(isClientSecurityTrackingEnabled()).toBe(true);
  });

  it('returns false when set to "0"', () => {
    process.env.NEXT_PUBLIC_SECURITY_ACTIVITY_TRACKING = '0';
    expect(isClientSecurityTrackingEnabled()).toBe(false);
  });

  it('returns false when set to "false"', () => {
    process.env.NEXT_PUBLIC_SECURITY_ACTIVITY_TRACKING = 'false';
    expect(isClientSecurityTrackingEnabled()).toBe(false);
  });
});
