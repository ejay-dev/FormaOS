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

type PostHogSpies = {
  init: jest.Mock;
  identify: jest.Mock;
  reset: jest.Mock;
  capture: jest.Mock;
  getAllFlags: jest.Mock;
  isFeatureEnabled: jest.Mock;
  register: jest.Mock;
  people: { set: jest.Mock };
  opt_out_capturing: jest.Mock;
  opt_in_capturing: jest.Mock;
};

function makePostHogSpies(): PostHogSpies {
  return {
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
}

describe('monitoring/analytics', () => {
  const originalWindow = global.window;
  const originalDocument = (global as any).document;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // @ts-ignore
    delete (global as any).window;
    delete (global as any).document;
  });

  afterEach(() => {
    // @ts-ignore
    global.window = originalWindow;
    (global as any).document = originalDocument;
  });

  /**
   * The module reads PostHog off `window.posthog`. Installing a browser-ish
   * global BEFORE requiring the module means Analytics#init finds an already
   * loaded client, flips isInitialized, and every subsequent track() reaches
   * the capture spy instead of the internal queue.
   */
  async function browserAnalytics() {
    const posthog = makePostHogSpies();
    // @ts-ignore — minimal browser surface the module actually touches
    global.window = {
      posthog,
      location: { href: 'http://localhost/test', pathname: '/test' },
      setTimeout: (fn: () => void) => setTimeout(fn, 0),
    };
    // @ts-ignore
    global.document = {
      title: 'Test Page',
      referrer: 'http://referrer.example/',
      cookie: '',
    };

    analyticsModule = require('@/lib/monitoring/analytics');
    const analytics = analyticsModule.getAnalytics();
    // init() is async; let the microtask queue drain so isInitialized is set
    // before the test tracks anything.
    await Promise.resolve();
    await Promise.resolve();
    return { analytics, posthog };
  }

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
      const session = a.getSession();
      expect(session.userId).toBe('u1');
      expect(session.userProperties).toEqual({
        userId: 'u1',
        email: 'test@test.com',
        role: 'admin',
      });
    });

    it('forwards the identity to PostHog', async () => {
      const { analytics, posthog } = await browserAnalytics();
      analytics.identify('u1', { email: 'test@test.com', role: 'admin' });
      expect(posthog.identify).toHaveBeenCalledWith('u1', {
        email: 'test@test.com',
        role: 'admin',
      });
    });

    it('identifies without properties', async () => {
      const { analytics, posthog } = await browserAnalytics();
      analytics.identify('u2');
      expect(posthog.identify).toHaveBeenCalledWith('u2', undefined);
      expect(analytics.getSession().userProperties).toEqual({ userId: 'u2' });
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
      expect(session.userProperties).toEqual({});
    });

    it('resets PostHog so the next visitor is not stitched to the old identity', async () => {
      const { analytics, posthog } = await browserAnalytics();
      analytics.identify('u1');
      analytics.reset();
      expect(posthog.reset).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Analytics.track ─────────────────────────────────────────
  describe('track', () => {
    it('sends event when initialized', async () => {
      const { analytics, posthog } = await browserAnalytics();
      analytics.identify('u1');
      posthog.capture.mockClear();

      analytics.track('test_event', { key: 'value' });

      expect(posthog.capture).toHaveBeenCalledTimes(1);
      const [event, properties] = posthog.capture.mock.calls[0];
      expect(event).toBe('test_event');
      expect(properties).toMatchObject({
        key: 'value',
        url: 'http://localhost/test',
        session_id: analytics.getSession().sessionId,
      });
      expect(typeof properties.timestamp).toBe('number');
    });

    it('queues event when not initialized and flushes it once PostHog is up', async () => {
      // No window at require time -> init() bails, isInitialized stays false.
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();

      a.track('queued_event');
      expect(a.getSession().queuedEvents).toBe(1);

      a.track('second_event');
      expect(a.getSession().queuedEvents).toBe(2);
    });

    it('tracks without properties', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.track('bare_event');
      expect(posthog.capture).toHaveBeenCalledWith(
        'bare_event',
        expect.objectContaining({ session_id: expect.any(String) }),
      );
    });

    it('stamps the identified user on the queued event', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.identify('u9');
      a.track('after_identify');
      expect(a.getSession().userId).toBe('u9');
      expect(a.getSession().queuedEvents).toBe(1);
    });
  });

  // ─── Analytics.page ───────────────────────────────────────────
  describe('page', () => {
    it('returns early when window is undefined', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      a.page('TestPage', { extra: true });
      // Server-side page() is a no-op: nothing queued, nothing sent.
      expect(a.getSession().queuedEvents).toBe(0);
    });

    it('tracks page with all properties when window exists', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();

      analytics.page('Dashboard');

      const expectedPageProps = {
        page_title: 'Test Page',
        page_url: 'http://localhost/test',
        page_path: '/test',
        page_name: 'Dashboard',
        referrer: 'http://referrer.example/',
      };
      // page() both records an internal page_view and fires PostHog's $pageview
      expect(posthog.capture).toHaveBeenCalledWith(
        'page_view',
        expect.objectContaining(expectedPageProps),
      );
      expect(posthog.capture).toHaveBeenCalledWith(
        '$pageview',
        expect.objectContaining(expectedPageProps),
      );
    });

    it('tracks page without pageName', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.page();
      expect(posthog.capture).toHaveBeenCalledWith(
        '$pageview',
        expect.objectContaining({ page_name: undefined, page_path: '/test' }),
      );
    });
  });

  // ─── Analytics.feature ────────────────────────────────────────
  describe('feature', () => {
    it('tracks feature usage', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.feature('checklist', 'opened', { checklistId: 'c1' });
      expect(posthog.capture).toHaveBeenCalledWith(
        'feature_used',
        expect.objectContaining({
          feature_name: 'checklist',
          feature_action: 'opened',
          checklistId: 'c1',
        }),
      );
    });

    it('tracks without extra properties', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.feature('roadmap', 'viewed');
      expect(posthog.capture).toHaveBeenCalledWith(
        'feature_used',
        expect.objectContaining({
          feature_name: 'roadmap',
          feature_action: 'viewed',
        }),
      );
    });
  });

  // ─── Analytics.journey ────────────────────────────────────────
  describe('journey', () => {
    it.each([
      ['onboarding', 'started', undefined],
      ['onboarding', 'completed', { step: 3 }],
      ['checkout', 'failed', { error: 'payment_declined' }],
    ] as const)(
      'tracks journey step %s/%s',
      async (step, status, extra) => {
        const { analytics, posthog } = await browserAnalytics();
        posthog.capture.mockClear();
        analytics.journey(step, status, extra as Record<string, unknown>);
        expect(posthog.capture).toHaveBeenCalledWith(
          'user_journey',
          expect.objectContaining({
            journey_step: step,
            journey_status: status,
            ...(extra ?? {}),
          }),
        );
      },
    );
  });

  // ─── Analytics.business ───────────────────────────────────────
  describe('business', () => {
    it('tracks business metric', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.business('mrr', 15000, { currency: 'AUD' });
      expect(posthog.capture).toHaveBeenCalledWith(
        'business_metric',
        expect.objectContaining({
          metric_name: 'mrr',
          metric_value: 15000,
          currency: 'AUD',
        }),
      );
    });
  });

  // ─── Analytics.conversion ─────────────────────────────────────
  describe('conversion', () => {
    it('tracks conversion event with value', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.conversion('signup', 1, { source: 'organic' });
      expect(posthog.capture).toHaveBeenCalledWith(
        'conversion',
        expect.objectContaining({
          conversion_event: 'signup',
          conversion_value: 1,
          source: 'organic',
        }),
      );
    });

    it('tracks conversion without value', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.conversion('trial_start');
      expect(posthog.capture).toHaveBeenCalledWith(
        'conversion',
        expect.objectContaining({
          conversion_event: 'trial_start',
          conversion_value: undefined,
        }),
      );
    });
  });

  // ─── Analytics.performance ────────────────────────────────────
  describe('performance', () => {
    it('tracks performance metric', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.performance('page_load', 1200, { route: '/dashboard' });
      expect(posthog.capture).toHaveBeenCalledWith(
        'performance_metric',
        expect.objectContaining({
          metric_name: 'page_load',
          metric_value: 1200,
          route: '/dashboard',
        }),
      );
    });
  });

  // ─── Analytics.experiment ─────────────────────────────────────
  describe('experiment', () => {
    it('tracks experiment viewed', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analytics.experiment('pricing_test', 'variant_b', { position: 'hero' });
      expect(posthog.capture).toHaveBeenCalledWith(
        'experiment_viewed',
        expect.objectContaining({
          experiment_name: 'pricing_test',
          experiment_variant: 'variant_b',
          position: 'hero',
        }),
      );
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

    it('returns the flags PostHog resolves', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.getAllFlags.mockResolvedValueOnce({ 'flag-a': true, beta: 'v2' });
      await expect(analytics.getFeatureFlags()).resolves.toEqual({
        'flag-a': true,
        beta: 'v2',
      });
    });

    it('falls back to an empty map when PostHog throws', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.getAllFlags.mockRejectedValueOnce(new Error('network'));
      await expect(analytics.getFeatureFlags()).resolves.toEqual({});
    });
  });

  // ─── Analytics.isFeatureEnabled ───────────────────────────────
  describe('isFeatureEnabled', () => {
    it('returns false when window is undefined', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      expect(a.isFeatureEnabled('test-flag')).toBe(false);
    });

    it('delegates to PostHog when available', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.isFeatureEnabled.mockReturnValueOnce(true);
      expect(analytics.isFeatureEnabled('test-flag')).toBe(true);
      expect(posthog.isFeatureEnabled).toHaveBeenCalledWith('test-flag');

      posthog.isFeatureEnabled.mockReturnValueOnce(false);
      expect(analytics.isFeatureEnabled('test-flag')).toBe(false);
    });

    it('returns false when the PostHog lookup throws', async () => {
      const { analytics, posthog } = await browserAnalytics();
      posthog.isFeatureEnabled.mockImplementationOnce(() => {
        throw new Error('boom');
      });
      expect(analytics.isFeatureEnabled('test-flag')).toBe(false);
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
      a.setUserProperties({ plan: 'pro' });
      a.setUserProperties({ role: 'admin' });
      const session = a.getSession();
      expect(session.userProperties).toEqual({ plan: 'pro', role: 'admin' });
    });

    it('pushes the properties to the PostHog person profile', async () => {
      const { analytics, posthog } = await browserAnalytics();
      analytics.setUserProperties({ plan: 'pro', role: 'admin' });
      expect(posthog.people.set).toHaveBeenCalledWith({
        plan: 'pro',
        role: 'admin',
      });
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

    it('opts the PostHog client out and back in — the GDPR consent lever', async () => {
      const { analytics, posthog } = await browserAnalytics();

      analytics.optOut();
      expect(posthog.opt_out_capturing).toHaveBeenCalledTimes(1);
      expect(posthog.opt_in_capturing).not.toHaveBeenCalled();

      analytics.optIn();
      expect(posthog.opt_in_capturing).toHaveBeenCalledTimes(1);
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
    it('does not track a mount on the server', () => {
      analyticsModule = require('@/lib/monitoring/analytics');
      const a = analyticsModule.getAnalytics();
      analyticsModule.useTrackMount('ServerComponent');
      // The window guard is the whole point of the hook — a regression that
      // drops it would queue a mount event during SSR.
      expect(a.getSession().queuedEvents).toBe(0);
    });

    it('tracks component_mounted in the browser', async () => {
      const { posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analyticsModule.useTrackMount('ClientComponent', { variant: 'a' });
      expect(posthog.capture).toHaveBeenCalledWith(
        'component_mounted',
        expect.objectContaining({
          component_name: 'ClientComponent',
          variant: 'a',
        }),
      );
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

    it('onMount tracks component_mounted', async () => {
      const { posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analyticsModule.useTrackLifecycle('TestComp').onMount({ step: 1 });
      expect(posthog.capture).toHaveBeenCalledWith(
        'component_mounted',
        expect.objectContaining({ component_name: 'TestComp', step: 1 }),
      );
    });

    it('onUnmount tracks component_unmounted', async () => {
      const { posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analyticsModule.useTrackLifecycle('TestComp').onUnmount();
      expect(posthog.capture).toHaveBeenCalledWith(
        'component_unmounted',
        expect.objectContaining({ component_name: 'TestComp' }),
      );
    });

    it('onUpdate tracks component_updated', async () => {
      const { posthog } = await browserAnalytics();
      posthog.capture.mockClear();
      analyticsModule.useTrackLifecycle('TestComp').onUpdate({ changes: 3 });
      expect(posthog.capture).toHaveBeenCalledWith(
        'component_updated',
        expect.objectContaining({ component_name: 'TestComp', changes: 3 }),
      );
    });
  });
});
