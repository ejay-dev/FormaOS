import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import {
  classifyHomepageRenderDuration,
  deriveHomepageTelemetryConfig,
  getHomepageTelemetryDebugSnapshot,
  HOMEPAGE_TELEMETRY,
  useHomepageTelemetry,
} from '@/lib/marketing/homepage-telemetry';
import type { HomepageMotionPolicy } from '@/lib/marketing/homepage-experience';

const trackMock = jest.fn();
const trackMetricMock = jest.fn();

jest.mock('@/lib/monitoring/analytics', () => ({
  useAnalytics: () => ({
    track: trackMock,
  }),
}));

jest.mock('@/lib/monitoring/performance-monitor', () => ({
  trackCustomMetric: (...args: unknown[]) => trackMetricMock(...args),
}));

const BASE_POLICY: HomepageMotionPolicy = {
  allowIntroMotion: true,
  allowOrbitalMotion: true,
  allowBackgroundOverlays: true,
  allowPulseTokens: true,
  allowStickyCtaMotion: true,
  shouldTrackFineGrainedTelemetry: true,
  maxDeferredSections: 7,
  stickyCtaWindow: {
    enter: 0.72,
    exit: 0.97,
  },
  performanceProfile: 'immersive',
};

type HookApi = ReturnType<typeof useHomepageTelemetry>;

function Harness({
  policy,
  enabled = true,
  samplingRate = 1,
  onReady,
}: {
  policy: HomepageMotionPolicy;
  enabled?: boolean;
  samplingRate?: number;
  onReady: (api: HookApi) => void;
}) {
  const api = useHomepageTelemetry(policy, {
    enabled,
    samplingRate,
  });

  useEffect(() => {
    onReady(api);
  }, [api, onReady]);

  return null;
}

describe('homepage-telemetry: deriveHomepageTelemetryConfig', () => {
  test('returns detailed telemetry config for immersive profiles', () => {
    const config = deriveHomepageTelemetryConfig(BASE_POLICY, 0.8);
    expect(config.enabled).toBe(true);
    expect(config.samplingRate).toBe(0.8);
    expect(config.profile).toBe('immersive');
    expect(config.detailedTelemetry).toBe(true);
  });

  test('caps low-fidelity sampling in battery saver mode', () => {
    const config = deriveHomepageTelemetryConfig(
      {
        ...BASE_POLICY,
        performanceProfile: 'battery_saver',
        shouldTrackFineGrainedTelemetry: false,
      },
      0.01,
    );
    expect(config.profile).toBe('battery_saver');
    expect(config.samplingRate).toBeGreaterThanOrEqual(0.05);
    expect(config.detailedTelemetry).toBe(false);
  });

  test('clamps sampling rates outside bounds', () => {
    const high = deriveHomepageTelemetryConfig(BASE_POLICY, 42);
    const low = deriveHomepageTelemetryConfig(BASE_POLICY, -2);
    expect(high.samplingRate).toBe(1);
    expect(low.samplingRate).toBe(0);
  });
});

describe('homepage-telemetry: helpers', () => {
  test.each([
    [400, 'good'],
    [1700, 'warn'],
    [3200, 'poor'],
  ] as const)('classifies render duration %dms as %s', (duration, expected) => {
    expect(classifyHomepageRenderDuration(duration)).toBe(expected);
  });

  test('returns debug snapshot data', () => {
    const config = deriveHomepageTelemetryConfig(BASE_POLICY, 0.67);
    expect(getHomepageTelemetryDebugSnapshot(config)).toEqual({
      enabled: true,
      samplingRate: 0.67,
      profile: 'immersive',
      detailedTelemetry: true,
    });
  });
});

describe('homepage-telemetry: hook', () => {
  let api: HookApi | null = null;

  beforeEach(() => {
    api = null;
    trackMock.mockClear();
    trackMetricMock.mockClear();
  });

  const setup = (
    policy: HomepageMotionPolicy = BASE_POLICY,
    options?: { enabled?: boolean; samplingRate?: number },
  ) => {
    render(
      <Harness
        policy={policy}
        enabled={options?.enabled}
        samplingRate={options?.samplingRate}
        onReady={(nextApi) => {
          api = nextApi;
        }}
      />,
    );
    expect(api).not.toBeNull();
    return api as HookApi;
  };

  test('tracks hero impression only once', () => {
    const telemetry = setup();
    act(() => {
      telemetry.trackHeroImpression({ source: 'test' });
      telemetry.trackHeroImpression({ source: 'test_repeat' });
    });

    const matching = trackMock.mock.calls.filter(
      ([event]) => event === HOMEPAGE_TELEMETRY.HERO_IMPRESSION,
    );
    expect(matching).toHaveLength(1);
  });

  test('tracks primary CTA click payload', () => {
    const telemetry = setup();
    act(() => {
      telemetry.trackCtaClick(
        'primary',
        'Start Free Trial',
        '/auth/signup?plan=pro',
        {
          isAuthRoute: true,
        },
      );
    });

    const call = trackMock.mock.calls.find(
      ([event]) => event === HOMEPAGE_TELEMETRY.HERO_CTA_CLICK,
    );
    expect(call).toBeDefined();
    expect(call?.[1]).toMatchObject({
      cta_label: 'Start Free Trial',
      cta_variant: 'primary',
      cta_href: '/auth/signup?plan=pro',
      isAuthRoute: true,
      trigger: 'click',
    });
  });

  test('tracks sticky impression once and sticky click separately', () => {
    const telemetry = setup();
    act(() => {
      telemetry.trackStickyImpression({ source: 'intersection' });
      telemetry.trackStickyImpression({ source: 'repeat' });
      telemetry.trackCtaClick(
        'sticky',
        'Start Free Trial',
        '/auth/signup?plan=pro',
      );
    });

    const impressionCalls = trackMock.mock.calls.filter(
      ([event]) => event === HOMEPAGE_TELEMETRY.STICKY_CTA_IMPRESSION,
    );
    const clickCalls = trackMock.mock.calls.filter(
      ([event]) => event === HOMEPAGE_TELEMETRY.STICKY_CTA_CLICK,
    );

    expect(impressionCalls).toHaveLength(1);
    expect(clickCalls).toHaveLength(1);
  });

  test('tracks section rendered and deferred semantics', () => {
    const telemetry = setup();
    act(() => {
      telemetry.trackSectionRendered('compliance_network', false, {
        reason: 'critical_section',
      });
      telemetry.trackSectionRendered('scroll_story', true, {
        reason: 'deferred_for_performance',
      });
    });

    const rendered = trackMock.mock.calls.find(
      ([event]) => event === HOMEPAGE_TELEMETRY.SECTION_RENDERED,
    );
    const deferred = trackMock.mock.calls.find(
      ([event]) => event === HOMEPAGE_TELEMETRY.SECTION_DEFERRED,
    );

    expect(rendered?.[1]).toMatchObject({
      section: 'compliance_network',
      trigger: 'render',
      reason: 'critical_section',
    });
    expect(deferred?.[1]).toMatchObject({
      section: 'scroll_story',
      trigger: 'defer',
      reason: 'deferred_for_performance',
    });
  });

  test('emits runtime profile and quality warning events', () => {
    const telemetry = setup();
    act(() => {
      telemetry.trackRuntimeProfile({
        tier: 'high',
        profile: 'immersive',
      });
      telemetry.trackQualityWarning({
        issueField: 'headlinePrimary',
        issueMessage: 'headline too long',
      });
    });

    const runtimeProfileCall = trackMock.mock.calls.find(
      ([event]) => event === HOMEPAGE_TELEMETRY.RUNTIME_PROFILE,
    );
    const qualityCall = trackMock.mock.calls.find(
      ([event]) => event === HOMEPAGE_TELEMETRY.QUALITY_WARNING,
    );

    expect(runtimeProfileCall?.[1]).toMatchObject({
      trigger: 'runtime',
      tier: 'high',
      profile: 'immersive',
    });
    expect(qualityCall?.[1]).toMatchObject({
      issueField: 'headlinePrimary',
      issueMessage: 'headline too long',
    });
  });

  test('tracks custom metrics and measured tasks', () => {
    const telemetry = setup();
    act(() => {
      telemetry.trackMetric('homepage_render_stage', 123, {
        stage: 'hero',
      });
    });

    expect(trackMetricMock).toHaveBeenCalledWith(
      'homepage_render_stage',
      123,
      expect.objectContaining({
        surface: 'homepage',
        profile: 'immersive',
        stage: 'hero',
      }),
    );

    const finishTask = telemetry.beginMeasuredTask('homepage_async_stage');
    act(() => {
      const duration = finishTask({ stage: 'deferred_mount' });
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    expect(trackMetricMock).toHaveBeenCalledWith(
      'homepage_async_stage',
      expect.any(Number),
      expect.objectContaining({
        surface: 'homepage',
        profile: 'immersive',
        stage: 'deferred_mount',
      }),
    );
  });

  test('respects explicit disabled state', () => {
    const telemetry = setup(BASE_POLICY, { enabled: false, samplingRate: 1 });
    act(() => {
      telemetry.trackHeroImpression();
      telemetry.trackCtaClick('primary', 'Start', '/auth/signup');
      telemetry.trackMetric('homepage_disabled_metric', 1);
    });

    expect(trackMock).not.toHaveBeenCalled();
    expect(trackMetricMock).not.toHaveBeenCalled();
  });

  test('exposes configuration in hook return value', () => {
    const telemetry = setup(
      {
        ...BASE_POLICY,
        performanceProfile: 'balanced',
      },
      { samplingRate: 0.5 },
    );

    expect(telemetry.config.profile).toBe('balanced');
    expect(telemetry.config.samplingRate).toBe(0.5);
    expect(typeof telemetry.enabled).toBe('boolean');
  });
});
