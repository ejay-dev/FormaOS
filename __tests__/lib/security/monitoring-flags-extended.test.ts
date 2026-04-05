/**
 * Tests for lib/security/monitoring-flags.ts
 */

describe('Security monitoring flags', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...origEnv };
  });

  afterAll(() => {
    process.env = origEnv;
  });

  function loadModule() {
    return require('@/lib/security/monitoring-flags');
  }

  describe('isSecurityMonitoringEnabled', () => {
    it('returns true when env is not set', () => {
      delete process.env.SECURITY_MONITORING_ENABLED;
      const { isSecurityMonitoringEnabled } = loadModule();
      expect(isSecurityMonitoringEnabled()).toBe(true);
    });

    it('returns true when env is "1"', () => {
      process.env.SECURITY_MONITORING_ENABLED = '1';
      const { isSecurityMonitoringEnabled } = loadModule();
      expect(isSecurityMonitoringEnabled()).toBe(true);
    });

    it('returns false when env is "0"', () => {
      process.env.SECURITY_MONITORING_ENABLED = '0';
      const { isSecurityMonitoringEnabled } = loadModule();
      expect(isSecurityMonitoringEnabled()).toBe(false);
    });

    it('returns false when env is "false"', () => {
      process.env.SECURITY_MONITORING_ENABLED = 'false';
      const { isSecurityMonitoringEnabled } = loadModule();
      expect(isSecurityMonitoringEnabled()).toBe(false);
    });

    it('returns false when env is "FALSE"', () => {
      process.env.SECURITY_MONITORING_ENABLED = 'FALSE';
      const { isSecurityMonitoringEnabled } = loadModule();
      expect(isSecurityMonitoringEnabled()).toBe(false);
    });

    it('returns true when env is "true"', () => {
      process.env.SECURITY_MONITORING_ENABLED = 'true';
      const { isSecurityMonitoringEnabled } = loadModule();
      expect(isSecurityMonitoringEnabled()).toBe(true);
    });
  });

  describe('isSecurityDashboardEnabled', () => {
    it('returns true by default', () => {
      delete process.env.SECURITY_MONITORING_DASHBOARD_ENABLED;
      const { isSecurityDashboardEnabled } = loadModule();
      expect(isSecurityDashboardEnabled()).toBe(true);
    });

    it('returns false when set to 0', () => {
      process.env.SECURITY_MONITORING_DASHBOARD_ENABLED = '0';
      const { isSecurityDashboardEnabled } = loadModule();
      expect(isSecurityDashboardEnabled()).toBe(false);
    });
  });

  describe('isClientSecurityTrackingEnabled', () => {
    it('returns true by default', () => {
      delete process.env.NEXT_PUBLIC_SECURITY_ACTIVITY_TRACKING;
      const { isClientSecurityTrackingEnabled } = loadModule();
      expect(isClientSecurityTrackingEnabled()).toBe(true);
    });

    it('returns false when set to false', () => {
      process.env.NEXT_PUBLIC_SECURITY_ACTIVITY_TRACKING = 'false';
      const { isClientSecurityTrackingEnabled } = loadModule();
      expect(isClientSecurityTrackingEnabled()).toBe(false);
    });
  });
});
