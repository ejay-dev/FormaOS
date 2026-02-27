import type { RuntimeMarketingConfig } from '@/lib/control-plane/types';
import type { DeviceTier } from '@/lib/device-tier';

export type HomepageSectionKey =
  | 'hero'
  | 'framework_trust_strip'
  | 'value_proposition'
  | 'compliance_network'
  | 'interactive_demo'
  | 'scroll_story'
  | 'compliance_engine_demo'
  | 'capabilities_grid'
  | 'evidence_showcase'
  | 'industries'
  | 'task_showcase'
  | 'security'
  | 'outcome_proof'
  | 'objection_handling'
  | 'procurement_flow'
  | 'cta'
  | 'trust';

export interface HeroRuntimeCopy {
  badgeText: string;
  headlinePrimary: string;
  headlineAccent: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface HomepageCtaAction {
  label: string;
  href: string;
  isAppDomain: boolean;
  isAuthRoute: boolean;
}

export interface HomepageHeroCtas {
  primary: HomepageCtaAction;
  secondary: HomepageCtaAction;
}

export interface HomepageMotionContext {
  reducedMotion: boolean;
  expensiveEffectsEnabled: boolean;
  pageVisible: boolean;
  heroInView: boolean;
  deviceTier: DeviceTier;
  saveDataEnabled?: boolean;
  prefersContrastMore?: boolean;
}

export interface HomepageMotionPolicy {
  allowIntroMotion: boolean;
  allowOrbitalMotion: boolean;
  allowBackgroundOverlays: boolean;
  allowPulseTokens: boolean;
  allowStickyCtaMotion: boolean;
  shouldTrackFineGrainedTelemetry: boolean;
  maxDeferredSections: number;
  stickyCtaWindow: {
    enter: number;
    exit: number;
  };
  performanceProfile: 'battery_saver' | 'balanced' | 'immersive';
}

export interface HomepageSectionDecision {
  key: HomepageSectionKey;
  visible: boolean;
  deferred: boolean;
  critical: boolean;
  reason: string;
}

const HOMEPAGE_SECTION_ORDER: HomepageSectionKey[] = [
  'hero',
  'framework_trust_strip',
  'value_proposition',
  'compliance_network',
  'interactive_demo',
  'scroll_story',
  'compliance_engine_demo',
  'capabilities_grid',
  'evidence_showcase',
  'industries',
  'task_showcase',
  'security',
  'outcome_proof',
  'objection_handling',
  'procurement_flow',
  'cta',
  'trust',
];

const HOMEPAGE_CRITICAL_SECTIONS = new Set<HomepageSectionKey>([
  'hero',
  'framework_trust_strip',
  'value_proposition',
  'compliance_network',
]);

const AUTH_ROUTE_PREFIX = '/auth';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const sanitizeText = (
  value: string,
  fallback: string,
  maxLength: number,
) => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.length > maxLength) return `${trimmed.slice(0, maxLength - 3)}...`;
  return trimmed;
};

const sanitizeHref = (href: string, fallback: string) => {
  const trimmed = href.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('javascript:')) return fallback;
  return trimmed;
};

export function normalizeHeroCopy(
  incoming: Partial<HeroRuntimeCopy> | undefined,
  fallback: HeroRuntimeCopy,
): HeroRuntimeCopy {
  const source = incoming ?? {};
  return {
    badgeText: sanitizeText(
      source.badgeText ?? fallback.badgeText,
      fallback.badgeText,
      80,
    ),
    headlinePrimary: sanitizeText(
      source.headlinePrimary ?? fallback.headlinePrimary,
      fallback.headlinePrimary,
      96,
    ),
    headlineAccent: sanitizeText(
      source.headlineAccent ?? fallback.headlineAccent,
      fallback.headlineAccent,
      96,
    ),
    subheadline: sanitizeText(
      source.subheadline ?? fallback.subheadline,
      fallback.subheadline,
      280,
    ),
    primaryCtaLabel: sanitizeText(
      source.primaryCtaLabel ?? fallback.primaryCtaLabel,
      fallback.primaryCtaLabel,
      40,
    ),
    primaryCtaHref: sanitizeHref(
      source.primaryCtaHref ?? fallback.primaryCtaHref,
      fallback.primaryCtaHref,
    ),
    secondaryCtaLabel: sanitizeText(
      source.secondaryCtaLabel ?? fallback.secondaryCtaLabel,
      fallback.secondaryCtaLabel,
      40,
    ),
    secondaryCtaHref: sanitizeHref(
      source.secondaryCtaHref ?? fallback.secondaryCtaHref,
      fallback.secondaryCtaHref,
    ),
  };
}

export function resolveHomepageCtas(
  heroCopy: HeroRuntimeCopy,
  appBase: string,
): HomepageHeroCtas {
  const safeBase = normalizeUrl(appBase);

  const resolveHref = (href: string) => {
    if (href.startsWith(AUTH_ROUTE_PREFIX)) {
      return `${safeBase}${href}`;
    }
    return href;
  };

  const toAction = (label: string, href: string): HomepageCtaAction => {
    const resolvedHref = resolveHref(href);
    return {
      label,
      href: resolvedHref,
      isAppDomain: resolvedHref.startsWith(safeBase),
      isAuthRoute: href.startsWith(AUTH_ROUTE_PREFIX),
    };
  };

  return {
    primary: toAction(heroCopy.primaryCtaLabel, heroCopy.primaryCtaHref),
    secondary: toAction(heroCopy.secondaryCtaLabel, heroCopy.secondaryCtaHref),
  };
}

export function deriveHomepageMotionPolicy(
  context: HomepageMotionContext,
): HomepageMotionPolicy {
  const reducedMotion = parseBoolean(context.reducedMotion, false);
  const expensiveEffectsEnabled = parseBoolean(context.expensiveEffectsEnabled, true);
  const pageVisible = parseBoolean(context.pageVisible, true);
  const heroInView = parseBoolean(context.heroInView, true);
  const saveDataEnabled = parseBoolean(context.saveDataEnabled, false);
  const prefersContrastMore = parseBoolean(context.prefersContrastMore, false);

  const lowTier = context.deviceTier === 'low';
  const midTier = context.deviceTier === 'mid';
  const highTier = context.deviceTier === 'high';

  const allowIntroMotion =
    !reducedMotion && !saveDataEnabled && expensiveEffectsEnabled && !lowTier;
  const allowOrbitalMotion =
    allowIntroMotion && highTier && pageVisible && heroInView;
  const allowBackgroundOverlays =
    !reducedMotion &&
    expensiveEffectsEnabled &&
    !saveDataEnabled &&
    pageVisible &&
    highTier;
  const allowPulseTokens = !reducedMotion && !prefersContrastMore;
  const allowStickyCtaMotion = !reducedMotion && pageVisible;

  let maxDeferredSections = 8;
  if (lowTier || saveDataEnabled) maxDeferredSections = 11;
  if (midTier) maxDeferredSections = 9;
  if (highTier && !saveDataEnabled) maxDeferredSections = 7;

  let performanceProfile: HomepageMotionPolicy['performanceProfile'] = 'balanced';
  if (saveDataEnabled || lowTier || reducedMotion) performanceProfile = 'battery_saver';
  if (highTier && !saveDataEnabled && !reducedMotion) performanceProfile = 'immersive';

  const stickyEnter = clamp(allowIntroMotion ? 0.72 : 0.68, 0.55, 0.86);
  const stickyExit = clamp(allowIntroMotion ? 0.97 : 0.94, 0.85, 0.995);

  return {
    allowIntroMotion,
    allowOrbitalMotion,
    allowBackgroundOverlays,
    allowPulseTokens,
    allowStickyCtaMotion,
    shouldTrackFineGrainedTelemetry:
      !saveDataEnabled && (midTier || highTier) && pageVisible,
    maxDeferredSections,
    stickyCtaWindow: {
      enter: stickyEnter,
      exit: stickyExit,
    },
    performanceProfile,
  };
}

const toSectionVisibility = (runtime: RuntimeMarketingConfig['runtime']) => ({
  value_proposition: runtime.sectionVisibility.value_proposition !== false,
  compliance_network: runtime.sectionVisibility.compliance_network !== false,
  interactive_demo: runtime.sectionVisibility.interactive_demo !== false,
  scroll_story: runtime.sectionVisibility.scroll_story !== false,
  compliance_engine_demo: runtime.sectionVisibility.compliance_engine_demo !== false,
  capabilities_grid: runtime.sectionVisibility.capabilities_grid !== false,
  evidence_showcase: runtime.sectionVisibility.evidence_showcase !== false,
  industries: runtime.sectionVisibility.industries !== false,
  task_showcase: runtime.sectionVisibility.task_showcase !== false,
  security: runtime.sectionVisibility.security !== false,
  outcome_proof: runtime.sectionVisibility.outcome_proof !== false,
  objection_handling: runtime.sectionVisibility.objection_handling !== false,
  procurement_flow: runtime.sectionVisibility.procurement_flow !== false,
  cta: runtime.sectionVisibility.cta !== false,
  trust: runtime.sectionVisibility.trust !== false,
});

const mapSectionVisibility = (
  key: HomepageSectionKey,
  visibility: ReturnType<typeof toSectionVisibility>,
) => {
  if (key === 'hero' || key === 'framework_trust_strip') return true;
  if (key === 'value_proposition') return visibility.value_proposition;
  if (key === 'compliance_network') return visibility.compliance_network;
  if (key === 'interactive_demo') return visibility.interactive_demo;
  if (key === 'scroll_story') return visibility.scroll_story;
  if (key === 'compliance_engine_demo') return visibility.compliance_engine_demo;
  if (key === 'capabilities_grid') return visibility.capabilities_grid;
  if (key === 'evidence_showcase') return visibility.evidence_showcase;
  if (key === 'industries') return visibility.industries;
  if (key === 'task_showcase') return visibility.task_showcase;
  if (key === 'security') return visibility.security;
  if (key === 'outcome_proof') return visibility.outcome_proof;
  if (key === 'objection_handling') return visibility.objection_handling;
  if (key === 'procurement_flow') return visibility.procurement_flow;
  if (key === 'cta') return visibility.cta;
  if (key === 'trust') return visibility.trust;
  return false;
};

export function deriveHomepageSectionDecisions(
  runtime: RuntimeMarketingConfig['runtime'],
  policy: HomepageMotionPolicy,
): HomepageSectionDecision[] {
  const visibleMap = toSectionVisibility(runtime);
  const decisions: HomepageSectionDecision[] = [];

  let deferredAssigned = 0;
  for (const key of HOMEPAGE_SECTION_ORDER) {
    const visible = mapSectionVisibility(key, visibleMap);
    const critical = HOMEPAGE_CRITICAL_SECTIONS.has(key);

    if (!visible) {
      decisions.push({
        key,
        visible,
        deferred: false,
        critical,
        reason: 'runtime_visibility_disabled',
      });
      continue;
    }

    if (critical) {
      decisions.push({
        key,
        visible,
        deferred: false,
        critical,
        reason: 'critical_section',
      });
      continue;
    }

    const canDefer = deferredAssigned < policy.maxDeferredSections;
    const shouldDefer = canDefer;

    decisions.push({
      key,
      visible,
      deferred: shouldDefer,
      critical,
      reason: shouldDefer ? 'deferred_for_performance' : 'defer_budget_exhausted',
    });

    if (shouldDefer) deferredAssigned += 1;
  }

  return decisions;
}

export function decisionMapFromList(
  decisions: HomepageSectionDecision[],
): Record<HomepageSectionKey, HomepageSectionDecision> {
  return decisions.reduce((acc, decision) => {
    acc[decision.key] = decision;
    return acc;
  }, {} as Record<HomepageSectionKey, HomepageSectionDecision>);
}

export function getHomepagePolicyHints(
  policy: HomepageMotionPolicy,
): string[] {
  const hints: string[] = [];

  hints.push(`performance_profile:${policy.performanceProfile}`);
  hints.push(`defer_budget:${policy.maxDeferredSections}`);

  if (!policy.allowIntroMotion) hints.push('intro_motion_disabled');
  if (!policy.allowOrbitalMotion) hints.push('orbital_motion_disabled');
  if (!policy.allowBackgroundOverlays) hints.push('background_overlays_disabled');
  if (!policy.allowPulseTokens) hints.push('pulse_tokens_disabled');
  if (!policy.allowStickyCtaMotion) hints.push('sticky_cta_motion_disabled');
  if (!policy.shouldTrackFineGrainedTelemetry) hints.push('telemetry_simplified');

  return hints;
}

export function evaluateHeroCopyRisk(copy: HeroRuntimeCopy) {
  const issues: Array<{
    level: 'info' | 'warn';
    field: keyof HeroRuntimeCopy;
    message: string;
  }> = [];

  if (copy.headlinePrimary.length > 48) {
    issues.push({
      level: 'warn',
      field: 'headlinePrimary',
      message: 'Primary headline is long and may wrap unexpectedly on mobile.',
    });
  }

  if (copy.headlineAccent.length > 48) {
    issues.push({
      level: 'warn',
      field: 'headlineAccent',
      message: 'Headline accent is long and may reduce visual impact.',
    });
  }

  if (copy.subheadline.length > 220) {
    issues.push({
      level: 'warn',
      field: 'subheadline',
      message: 'Subheadline is long and may push core CTAs below the fold.',
    });
  }

  if (copy.primaryCtaLabel.length > 24) {
    issues.push({
      level: 'warn',
      field: 'primaryCtaLabel',
      message: 'Primary CTA label is long and may clip on narrow viewports.',
    });
  }

  if (!copy.secondaryCtaHref.startsWith('/')) {
    issues.push({
      level: 'info',
      field: 'secondaryCtaHref',
      message: 'Secondary CTA points off-site; validate navigation intent.',
    });
  }

  return issues;
}

export function summarizeHomepageDecisions(
  decisions: HomepageSectionDecision[],
): {
  totalVisible: number;
  totalDeferred: number;
  criticalVisible: number;
  nonCriticalVisible: number;
} {
  let totalVisible = 0;
  let totalDeferred = 0;
  let criticalVisible = 0;
  let nonCriticalVisible = 0;

  for (const decision of decisions) {
    if (!decision.visible) continue;
    totalVisible += 1;
    if (decision.deferred) totalDeferred += 1;
    if (decision.critical) criticalVisible += 1;
    if (!decision.critical) nonCriticalVisible += 1;
  }

  return {
    totalVisible,
    totalDeferred,
    criticalVisible,
    nonCriticalVisible,
  };
}

export function shouldStickyCtaBeVisible(
  progress: number,
  policy: HomepageMotionPolicy,
): boolean {
  return progress > policy.stickyCtaWindow.enter && progress < policy.stickyCtaWindow.exit;
}

export const HOMEPAGE_SECTION_KEYS = HOMEPAGE_SECTION_ORDER;
