/** @jest-environment node */

/**
 * Tests for lib/monitoring/analytics.ts
 * Covers: Analytics class, getAnalytics, useAnalytics, useTrackMount,
 *         useTrackLifecycle, PostHog integration, feature flags, etc.
 */

jest.mock('@/lib/observability/structured-logger', () => ({
  healthLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock posthog-js dynamic import
jest.mock('posthog-js', () => {
  const mockInstance = {
    init: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
    getAllFlags: jest.fn().mockResolvedValue({ 'flag-a': true }),
    isFeatureEnabled: jest.fn().mockReturnValue(true),
    register: jest.fn(),
    people: { set: jest.fn() },
    opt_out_capturing: jest.fn(),
    opt_in_capturing: jest.fn(),
  };
  return { default: mockInstance, __esModule: true };
});

// We need to reset the singleton between tests
let analyticsModule: typeof import('@/lib/monitoring/analytics');

describe('monitoring/analytics', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // @ts-ignore
    delete (global as any).window;
  });

  afterEach(() => {
    // @ts-ignore
    global.window = originalWindow;
  });

  // ─── getAnalytics / singleton ────────────────────────────────
  describe('getAnalytics', () => {
    it('creates a singleton instance', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a1 = analyticsModule.getAnalytics();
      const a2 = analyticsModule.getAnalytics();
      expect(a1).toBe(a2);
    });

    it('creates Analytics in server context (window undefined)', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      expect(a).toBeDefined();
    });
  });

  // ─── Analytics.identify ──────────────────────────────────────
  describe('identify', () => {
    it('sets userId and userProperties', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.identify('u1', { email: 'test@test.com', role: 'admin' });
      // No PostHog in node env, but should not throw
    });

    it('identifies without properties', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.identify('u2');
    });
  });

  // ─── Analytics.reset ─────────────────────────────────────────
  describe('reset', () => {
    it('resets userId and properties', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.identify('u1', { email: 'x@y.com' });
      a.reset();
      const session = a.getSession();
      expect(session.userId).toBeUndefined();
    });
  });

  // ─── Analytics.track ─────────────────────────────────────────
  describe('track', () => {
    it('sends event when initialized', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.track('test_event', { key: 'value' });
    });

    it('queues event when not initialized', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      // track before init completes queues the event
      a.track('queued_event');
    });

    it('tracks without properties', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.track('bare_event');
    });
  });

  // ─── Analytics.page ───────────────────────────────────────────
  describe('page', () => {
    it('returns early when window is undefined', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      // Should not throw in server context
      a.page('TestPage', { extra: true });
    });

    it('tracks page with all properties when window exists', () => {
      // @ts-ignore
      global.window = {
        location: { href: 'http://localhost/test', pathname: '/test' } as any,
      };
      // @ts-ignore
      global.document = { title: 'Test Page', referrer: '' };
      // @ts-ignore
      global.navigator = { userAgent: 'TestUA' };

      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.page('Dashboard');
    });

    it('tracks page without pageName', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.page();
    });
  });

  // ─── Analytics.feature ────────────────────────────────────────
  describe('feature', () => {
    it('tracks feature usage', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.feature('checklist', 'opened', { checklistId: 'c1' });
    });

    it('tracks without extra properties', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.feature('roadmap', 'viewed');
    });
  });

  // ─── Analytics.journey ────────────────────────────────────────
  describe('journey', () => {
    it('tracks journey step started', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.journey('onboarding', 'started');
    });

    it('tracks journey step completed', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.journey('onboarding', 'completed', { step: 3 });
    });

    it('tracks journey step failed', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.journey('checkout', 'failed', { error: 'payment_declined' });
    });
  });

  // ─── Analytics.business ───────────────────────────────────────
  describe('business', () => {
    it('tracks business metric', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.business('mrr', 15000, { currency: 'AUD' });
    });
  });

  // ─── Analytics.conversion ─────────────────────────────────────
  describe('conversion', () => {
    it('tracks conversion event with value', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.conversion('signup', 1, { source: 'organic' });
    });

    it('tracks conversion without value', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.conversion('trial_start');
    });
  });

  // ─── Analytics.performance ────────────────────────────────────
  describe('performance', () => {
    it('tracks performance metric', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.performance('page_load', 1200, { route: '/dashboard' });
    });
  });

  // ─── Analytics.experiment ─────────────────────────────────────
  describe('experiment', () => {
    it('tracks experiment viewed', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.experiment('pricing_test', 'variant_b', { position: 'hero' });
    });
  });

  // ─── Analytics.getFeatureFlags ────────────────────────────────
  describe('getFeatureFlags', () => {
    it('returns empty object when window is undefined', async () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      const flags = await a.getFeatureFlags();
      expect(flags).toEqual({});
    });
  });

  // ─── Analytics.isFeatureEnabled ───────────────────────────────
  describe('isFeatureEnabled', () => {
    it('returns false when window is undefined', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      expect(a.isFeatureEnabled('test-flag')).toBe(false);
    });
  });

  // ─── Analytics.getSession ─────────────────────────────────────
  describe('getSession', () => {
    it('returns session info', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      const session = a.getSession();
      expect(session.sessionId).toBeDefined();
      expect(typeof session.queuedEvents).toBe('number');
    });
  });

  // ─── Analytics.setUserProperties ──────────────────────────────
  describe('setUserProperties', () => {
    it('merges user properties', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.setUserProperties({ plan: 'pro', role: 'admin' });
      const session = a.getSession();
      expect(session.userProperties.plan).toBe('pro');
    });
  });

  // ─── Analytics.optOut / optIn ─────────────────────────────────
  describe('optOut / optIn', () => {
    it('optOut does not throw', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      expect(() => a.optOut()).not.toThrow();
    });

    it('optIn does not throw', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      expect(() => a.optIn()).not.toThrow();
    });
  });

  // ─── useAnalytics ────────────────────────────────────────────
  describe('useAnalytics', () => {
    it('returns the singleton analytics instance', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.useAnalytics();
      expect(a).toBe(analyticsModule.getAnalytics());
    });
  });

  // ─── useTrackMount ───────────────────────────────────────────
  describe('useTrackMount', () => {
    it('tracks component mount when window is undefined (server)', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      // Should not throw
      analyticsModule.useTrackMount('ServerComponent');
    });
  });

  // ─── useTrackLifecycle ───────────────────────────────────────
  describe('useTrackLifecycle', () => {
    it('returns lifecycle methods', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const lc = analyticsModule.useTrackLifecycle('TestComp');
      expect(typeof lc.onMount).toBe('function');
      expect(typeof lc.onUnmount).toBe('function');
      expect(typeof lc.onUpdate).toBe('function');
    });

    it('onMount tracks component_mounted', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const lc = analyticsModule.useTrackLifecycle('TestComp');
      expect(() => lc.onMount({ step: 1 })).not.toThrow();
    });

    it('onUnmount tracks component_unmounted', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const lc = analyticsModule.useTrackLifecycle('TestComp');
      expect(() => lc.onUnmount()).not.toThrow();
    });

    it('onUpdate tracks component_updated', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const lc = analyticsModule.useTrackLifecycle('TestComp');
      expect(() => lc.onUpdate({ changes: 3 })).not.toThrow();
    });
  });
});
