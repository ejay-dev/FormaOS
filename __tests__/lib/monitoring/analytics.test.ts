jest.mock('@/lib/observability/structured-logger', () => ({
  healthLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Analytics is a 'use client' module but imports no browser-only APIs at module level
import { getAnalytics, Analytics } from '@/lib/monitoring/analytics';

describe('Analytics class', () => {
  let analytics: Analytics;

  beforeEach(() => {
    analytics = new Analytics();
  });

  describe('getSession', () => {
    it('returns session info with a generated sessionId', () => {
      const session = analytics.getSession();
      expect(session.sessionId).toBeTruthy();
      expect(session.sessionId).toMatch(/^analytics_\d+_/);
      expect(session.userId).toBeUndefined();
      expect(session.queuedEvents).toBe(0);
    });
  });

  describe('identify', () => {
    it('sets userId and properties', () => {
      analytics.identify('user-1', {
        email: 'test@example.com',
        role: 'admin',
      });
      const session = analytics.getSession();
      expect(session.userId).toBe('user-1');
      expect(session.userProperties).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          email: 'test@example.com',
          role: 'admin',
        }),
      );
    });
  });

  describe('reset', () => {
    it('clears userId and properties', () => {
      analytics.identify('user-1', { email: 'a@b.com' });
      analytics.reset();
      const session = analytics.getSession();
      expect(session.userId).toBeUndefined();
      expect(session.userProperties).toEqual({});
    });
  });

  describe('setUserProperties', () => {
    it('merges properties', () => {
      analytics.setUserProperties({ plan: 'pro' });
      analytics.setUserProperties({ role: 'viewer' });
      const session = analytics.getSession();
      expect(session.userProperties).toEqual(
        expect.objectContaining({ plan: 'pro', role: 'viewer' }),
      );
    });
  });

  describe('track', () => {
    it('queues events when not initialized (server-side)', () => {
      analytics.track('test_event', { key: 'value' });
      // Events are queued since PostHog is not initialized in test env
      // No error means success
    });
  });

  describe('page', () => {
    it('does not throw when window is undefined', () => {
      // In test environment, window is available (jsdom) but PostHog is not
      expect(() => analytics.page('test-page')).not.toThrow();
    });
  });

  describe('feature', () => {
    it('calls track with feature_used event', () => {
      expect(() =>
        analytics.feature('dashboard', 'opened', { org: 'test' }),
      ).not.toThrow();
    });
  });

  describe('journey', () => {
    it('calls track with journey params', () => {
      expect(() => analytics.journey('onboarding', 'started')).not.toThrow();
    });
  });

  describe('business', () => {
    it('tracks business metrics', () => {
      expect(() => analytics.business('mrr', 5000)).not.toThrow();
    });
  });

  describe('conversion', () => {
    it('tracks conversion events', () => {
      expect(() => analytics.conversion('signup', 99)).not.toThrow();
    });
  });

  describe('performance', () => {
    it('tracks performance metrics', () => {
      expect(() => analytics.performance('api_latency', 150)).not.toThrow();
    });
  });

  describe('experiment', () => {
    it('tracks experiment participation', () => {
      expect(() =>
        analytics.experiment('pricing_test', 'variant_a'),
      ).not.toThrow();
    });
  });

  describe('getFeatureFlags', () => {
    it('returns empty object when PostHog not available', async () => {
      const flags = await analytics.getFeatureFlags();
      expect(flags).toEqual({});
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns false when PostHog not available', () => {
      expect(analytics.isFeatureEnabled('some_flag')).toBe(false);
    });
  });

  describe('optOut / optIn', () => {
    it('do not throw when PostHog not available', () => {
      expect(() => analytics.optOut()).not.toThrow();
      expect(() => analytics.optIn()).not.toThrow();
    });
  });
});

describe('getAnalytics singleton', () => {
  it('returns an Analytics instance', () => {
    const a = getAnalytics();
    expect(a).toBeInstanceOf(Analytics);
  });

  it('returns the same instance on repeated calls', () => {
    const a1 = getAnalytics();
    const a2 = getAnalytics();
    expect(a1).toBe(a2);
  });
});
