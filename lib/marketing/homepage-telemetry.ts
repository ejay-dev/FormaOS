'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAnalytics } from '@/lib/monitoring/analytics';
import { trackCustomMetric } from '@/lib/monitoring/performance-monitor';
import type { HomepageMotionPolicy, HomepageSectionKey } from '@/lib/marketing/homepage-experience';

export const HOMEPAGE_TELEMETRY = {
  HERO_IMPRESSION: 'homepage_hero_impression',
  HERO_CTA_CLICK: 'homepage_hero_cta_click',
  STICKY_CTA_IMPRESSION: 'homepage_sticky_cta_impression',
  STICKY_CTA_CLICK: 'homepage_sticky_cta_click',
  SECTION_RENDERED: 'homepage_section_rendered',
  SECTION_DEFERRED: 'homepage_section_deferred',
  QUALITY_WARNING: 'homepage_quality_warning',
  RUNTIME_PROFILE: 'homepage_runtime_profile',
} as const;

export type HomepageTelemetryEventName =
  (typeof HOMEPAGE_TELEMETRY)[keyof typeof HOMEPAGE_TELEMETRY];

export interface HomepageTelemetryMetadata {
  event: HomepageTelemetryEventName;
  path?: string;
  section?: HomepageSectionKey;
  ctaLabel?: string;
  ctaHref?: string;
  ctaVariant?: 'primary' | 'secondary' | 'sticky';
  trigger?: 'view' | 'click' | 'defer' | 'render' | 'runtime';
  profile?: string;
  value?: number;
  elapsedMs?: number;
  details?: Record<string, unknown>;
}

export interface HomepageTelemetryConfig {
  enabled: boolean;
  samplingRate: number;
  profile: HomepageMotionPolicy['performanceProfile'];
  detailedTelemetry: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeSamplingRate = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 1;
  return clamp(value, 0, 1);
};

const shouldSample = (samplingRate: number) => {
  if (samplingRate >= 1) return true;
  if (samplingRate <= 0) return false;
  return Math.random() <= samplingRate;
};

const safeWindowLocation = () => {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname;
};

const sanitizeDetails = (details: Record<string, unknown> | undefined) => {
  if (!details) return undefined;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined) continue;
    if (typeof value === 'function') continue;
    output[key] = value;
  }
  return output;
};

function emitTelemetryEvent(
  track: (event: string, properties?: Record<string, unknown>) => void,
  metadata: HomepageTelemetryMetadata,
) {
  const payload: Record<string, unknown> = {
    event: metadata.event,
    path: metadata.path ?? safeWindowLocation(),
    section: metadata.section,
    cta_label: metadata.ctaLabel,
    cta_href: metadata.ctaHref,
    cta_variant: metadata.ctaVariant,
    trigger: metadata.trigger,
    profile: metadata.profile,
    value: metadata.value,
    elapsed_ms: metadata.elapsedMs,
    ...sanitizeDetails(metadata.details),
  };

  track(metadata.event, payload);
}

export function deriveHomepageTelemetryConfig(
  policy: HomepageMotionPolicy,
  overrideSamplingRate?: number,
): HomepageTelemetryConfig {
  const samplingRate = normalizeSamplingRate(overrideSamplingRate);

  if (!policy.shouldTrackFineGrainedTelemetry) {
    return {
      enabled: true,
      samplingRate: clamp(samplingRate, 0.05, 1),
      profile: policy.performanceProfile,
      detailedTelemetry: false,
    };
  }

  if (policy.performanceProfile === 'battery_saver') {
    return {
      enabled: true,
      samplingRate: clamp(samplingRate, 0.25, 1),
      profile: policy.performanceProfile,
      detailedTelemetry: false,
    };
  }

  return {
    enabled: true,
    samplingRate,
    profile: policy.performanceProfile,
    detailedTelemetry: true,
  };
}

export function useHomepageTelemetry(
  policy: HomepageMotionPolicy,
  options?: {
    samplingRate?: number;
    enabled?: boolean;
  },
) {
  const analytics = useAnalytics();
  const config = useMemo(
    () => deriveHomepageTelemetryConfig(policy, options?.samplingRate),
    [policy, options?.samplingRate],
  );
  const enabled = (options?.enabled ?? true) && config.enabled;
  const sampled = useRef(shouldSample(config.samplingRate));
  const start = useRef<number>(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const once = useRef<Set<string>>(new Set());

  useEffect(() => {
    sampled.current = shouldSample(config.samplingRate);
  }, [config.samplingRate]);

  const track = useCallback(
    (metadata: HomepageTelemetryMetadata, onceKey?: string) => {
      if (!enabled || !sampled.current) return;
      if (onceKey && once.current.has(onceKey)) return;
      if (onceKey) once.current.add(onceKey);

      try {
        emitTelemetryEvent((event, properties) => analytics.track(event, properties), metadata);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[homepage-telemetry] track failed', error);
        }
      }
    },
    [analytics, enabled],
  );

  const trackMetric = useCallback(
    (name: string, value: number, details?: Record<string, unknown>) => {
      if (!enabled || !sampled.current) return;
      try {
        trackCustomMetric(name, value, {
          surface: 'homepage',
          profile: config.profile,
          ...sanitizeDetails(details),
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[homepage-telemetry] metric failed', error);
        }
      }
    },
    [config.profile, enabled],
  );

  const trackHeroImpression = useCallback(
    (details?: Record<string, unknown>) => {
      track(
        {
          event: HOMEPAGE_TELEMETRY.HERO_IMPRESSION,
          trigger: 'view',
          profile: config.profile,
          details,
        },
        'hero_impression',
      );
    },
    [config.profile, track],
  );

  const trackCtaClick = useCallback(
    (
      variant: HomepageTelemetryMetadata['ctaVariant'],
      label: string,
      href: string,
      details?: Record<string, unknown>,
    ) => {
      track({
        event:
          variant === 'sticky'
            ? HOMEPAGE_TELEMETRY.STICKY_CTA_CLICK
            : HOMEPAGE_TELEMETRY.HERO_CTA_CLICK,
        trigger: 'click',
        profile: config.profile,
        ctaVariant: variant,
        ctaLabel: label,
        ctaHref: href,
        elapsedMs:
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
          start.current,
        details,
      });
    },
    [config.profile, track],
  );

  const trackStickyImpression = useCallback(
    (details?: Record<string, unknown>) => {
      track(
        {
          event: HOMEPAGE_TELEMETRY.STICKY_CTA_IMPRESSION,
          trigger: 'view',
          profile: config.profile,
          details,
        },
        'sticky_cta_impression',
      );
    },
    [config.profile, track],
  );

  const trackSectionRendered = useCallback(
    (
      section: HomepageSectionKey,
      deferred: boolean,
      details?: Record<string, unknown>,
    ) => {
      track({
        event: deferred
          ? HOMEPAGE_TELEMETRY.SECTION_DEFERRED
          : HOMEPAGE_TELEMETRY.SECTION_RENDERED,
        trigger: deferred ? 'defer' : 'render',
        profile: config.profile,
        section,
        details,
      });
    },
    [config.profile, track],
  );

  const trackRuntimeProfile = useCallback(
    (details?: Record<string, unknown>) => {
      track(
        {
          event: HOMEPAGE_TELEMETRY.RUNTIME_PROFILE,
          trigger: 'runtime',
          profile: config.profile,
          details,
        },
        'runtime_profile',
      );
    },
    [config.profile, track],
  );

  const trackQualityWarning = useCallback(
    (details?: Record<string, unknown>) => {
      track({
        event: HOMEPAGE_TELEMETRY.QUALITY_WARNING,
        trigger: 'runtime',
        profile: config.profile,
        details,
      });
    },
    [config.profile, track],
  );

  const beginMeasuredTask = useCallback((name: string) => {
    const taskStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return (details?: Record<string, unknown>) => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const duration = now - taskStart;
      trackMetric(name, duration, details);
      return duration;
    };
  }, [trackMetric]);

  return {
    enabled,
    config,
    track,
    trackMetric,
    trackHeroImpression,
    trackCtaClick,
    trackStickyImpression,
    trackSectionRendered,
    trackRuntimeProfile,
    trackQualityWarning,
    beginMeasuredTask,
  };
}

export function classifyHomepageRenderDuration(durationMs: number): 'good' | 'warn' | 'poor' {
  if (durationMs < 1200) return 'good';
  if (durationMs < 2600) return 'warn';
  return 'poor';
}

export function getHomepageTelemetryDebugSnapshot(
  config: HomepageTelemetryConfig,
): Record<string, unknown> {
  return {
    enabled: config.enabled,
    samplingRate: config.samplingRate,
    profile: config.profile,
    detailedTelemetry: config.detailedTelemetry,
  };
}
