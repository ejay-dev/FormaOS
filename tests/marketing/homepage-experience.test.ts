import {
  decisionMapFromList,
  deriveHomepageMotionPolicy,
  deriveHomepageSectionDecisions,
  evaluateHeroCopyRisk,
  getHomepagePolicyHints,
  normalizeHeroCopy,
  resolveHomepageCtas,
  shouldStickyCtaBeVisible,
  summarizeHomepageDecisions,
  type HeroRuntimeCopy,
  type HomepageMotionContext,
} from '@/lib/marketing/homepage-experience';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';

const FALLBACK_HERO = DEFAULT_RUNTIME_MARKETING.hero satisfies HeroRuntimeCopy;

const makeMotionContext = (
  overrides: Partial<HomepageMotionContext> = {},
): HomepageMotionContext => ({
  reducedMotion: false,
  expensiveEffectsEnabled: true,
  pageVisible: true,
  heroInView: true,
  deviceTier: 'high',
  saveDataEnabled: false,
  prefersContrastMore: false,
  ...overrides,
});

describe('homepage-experience: normalizeHeroCopy', () => {
  test('uses fallback values when incoming copy is missing', () => {
    const normalized = normalizeHeroCopy(undefined, FALLBACK_HERO);
    expect(normalized).toEqual(FALLBACK_HERO);
  });

  test('sanitizes labels and hrefs while preserving valid values', () => {
    const normalized = normalizeHeroCopy(
      {
        badgeText: '   Enterprise-grade runtime controls   ',
        headlinePrimary: '  Operational Confidence  ',
        headlineAccent: 'Built for regulated teams',
        subheadline: '  Model. Execute. Verify. Defend.  ',
        primaryCtaLabel: '   Start Now   ',
        primaryCtaHref: ' /auth/signup?plan=enterprise ',
        secondaryCtaLabel: '   Talk to Sales   ',
        secondaryCtaHref: ' /contact ',
      },
      FALLBACK_HERO,
    );

    expect(normalized.badgeText).toBe('Enterprise-grade runtime controls');
    expect(normalized.headlinePrimary).toBe('Operational Confidence');
    expect(normalized.subheadline).toBe('Model. Execute. Verify. Defend.');
    expect(normalized.primaryCtaLabel).toBe('Start Now');
    expect(normalized.primaryCtaHref).toBe('/auth/signup?plan=enterprise');
    expect(normalized.secondaryCtaHref).toBe('/contact');
  });

  test('guards against empty strings and javascript hrefs', () => {
    const normalized = normalizeHeroCopy(
      {
        badgeText: ' ',
        primaryCtaLabel: '',
        secondaryCtaLabel: ' ',
        primaryCtaHref: 'javascript:alert(1)',
        secondaryCtaHref: 'javascript:void(0)',
      },
      FALLBACK_HERO,
    );

    expect(normalized.badgeText).toBe(FALLBACK_HERO.badgeText);
    expect(normalized.primaryCtaLabel).toBe(FALLBACK_HERO.primaryCtaLabel);
    expect(normalized.secondaryCtaLabel).toBe(FALLBACK_HERO.secondaryCtaLabel);
    expect(normalized.primaryCtaHref).toBe(FALLBACK_HERO.primaryCtaHref);
    expect(normalized.secondaryCtaHref).toBe(FALLBACK_HERO.secondaryCtaHref);
  });
});

describe('homepage-experience: resolveHomepageCtas', () => {
  test('rewrites auth routes to app domain and preserves site routes', () => {
    const ctas = resolveHomepageCtas(
      {
        ...FALLBACK_HERO,
        primaryCtaHref: '/auth/signup?plan=pro',
        secondaryCtaHref: '/contact',
      },
      'https://app.formaos.com.au/',
    );

    expect(ctas.primary.href).toBe('https://app.formaos.com.au/auth/signup?plan=pro');
    expect(ctas.primary.isAppDomain).toBe(true);
    expect(ctas.primary.isAuthRoute).toBe(true);
    expect(ctas.secondary.href).toBe('/contact');
    expect(ctas.secondary.isAppDomain).toBe(false);
    expect(ctas.secondary.isAuthRoute).toBe(false);
  });

  test('does not rewrite absolute urls', () => {
    const ctas = resolveHomepageCtas(
      {
        ...FALLBACK_HERO,
        secondaryCtaHref: 'https://docs.formaos.com.au/demo',
      },
      'https://app.formaos.com.au',
    );

    expect(ctas.secondary.href).toBe('https://docs.formaos.com.au/demo');
    expect(ctas.secondary.isAppDomain).toBe(false);
  });
});

describe('homepage-experience: deriveHomepageMotionPolicy', () => {
  test('returns immersive profile on high-tier capable devices', () => {
    const policy = deriveHomepageMotionPolicy(makeMotionContext({ deviceTier: 'high' }));
    expect(policy.performanceProfile).toBe('immersive');
    expect(policy.allowIntroMotion).toBe(true);
    expect(policy.allowOrbitalMotion).toBe(true);
    expect(policy.allowBackgroundOverlays).toBe(true);
    expect(policy.allowPulseTokens).toBe(true);
    expect(policy.allowStickyCtaMotion).toBe(true);
    expect(policy.maxDeferredSections).toBe(7);
  });

  test('downgrades to balanced profile on mid tier', () => {
    const policy = deriveHomepageMotionPolicy(makeMotionContext({ deviceTier: 'mid' }));
    expect(policy.performanceProfile).toBe('balanced');
    expect(policy.allowIntroMotion).toBe(true);
    expect(policy.allowBackgroundOverlays).toBe(false);
    expect(policy.maxDeferredSections).toBe(9);
  });

  test('downgrades to battery_saver when reduced motion is preferred', () => {
    const policy = deriveHomepageMotionPolicy(
      makeMotionContext({
        reducedMotion: true,
        deviceTier: 'high',
      }),
    );

    expect(policy.performanceProfile).toBe('battery_saver');
    expect(policy.allowIntroMotion).toBe(false);
    expect(policy.allowOrbitalMotion).toBe(false);
    expect(policy.allowBackgroundOverlays).toBe(false);
    expect(policy.allowPulseTokens).toBe(false);
    expect(policy.allowStickyCtaMotion).toBe(false);
  });

  test('disables orbital motion when hero is out of view', () => {
    const policy = deriveHomepageMotionPolicy(
      makeMotionContext({ heroInView: false }),
    );
    expect(policy.allowIntroMotion).toBe(true);
    expect(policy.allowOrbitalMotion).toBe(false);
  });

  test('disables motion-heavy effects in save-data mode', () => {
    const policy = deriveHomepageMotionPolicy(
      makeMotionContext({
        saveDataEnabled: true,
        deviceTier: 'high',
      }),
    );

    expect(policy.performanceProfile).toBe('battery_saver');
    expect(policy.allowIntroMotion).toBe(false);
    expect(policy.allowOrbitalMotion).toBe(false);
    expect(policy.allowBackgroundOverlays).toBe(false);
    expect(policy.maxDeferredSections).toBe(11);
  });

  test.each([
    ['low', 0.68, 0.94],
    ['mid', 0.72, 0.97],
    ['high', 0.72, 0.97],
  ] as const)(
    'produces sticky window defaults for %s-tier contexts',
    (tier, expectedEnter, expectedExit) => {
      const policy = deriveHomepageMotionPolicy(
        makeMotionContext({
          deviceTier: tier,
          reducedMotion: tier === 'low',
        }),
      );

      expect(policy.stickyCtaWindow.enter).toBeCloseTo(expectedEnter, 3);
      expect(policy.stickyCtaWindow.exit).toBeCloseTo(expectedExit, 3);
    },
  );
});

describe('homepage-experience: section decisions', () => {
  test('keeps critical sections non-deferred and visible', () => {
    const policy = deriveHomepageMotionPolicy(makeMotionContext());
    const decisions = deriveHomepageSectionDecisions(
      DEFAULT_RUNTIME_MARKETING.runtime,
      policy,
    );
    const map = decisionMapFromList(decisions);

    expect(map.hero.visible).toBe(true);
    expect(map.hero.deferred).toBe(false);
    expect(map.framework_trust_strip.visible).toBe(true);
    expect(map.framework_trust_strip.deferred).toBe(false);
    expect(map.value_proposition.visible).toBe(true);
    expect(map.value_proposition.deferred).toBe(false);
    expect(map.compliance_network.visible).toBe(true);
    expect(map.compliance_network.deferred).toBe(false);
  });

  test('honors runtime sectionVisibility flags', () => {
    const policy = deriveHomepageMotionPolicy(makeMotionContext());
    const runtime = {
      ...DEFAULT_RUNTIME_MARKETING.runtime,
      sectionVisibility: {
        ...DEFAULT_RUNTIME_MARKETING.runtime.sectionVisibility,
        security: false,
        trust: false,
      },
    };
    const decisions = deriveHomepageSectionDecisions(runtime, policy);
    const map = decisionMapFromList(decisions);

    expect(map.security.visible).toBe(false);
    expect(map.security.reason).toBe('runtime_visibility_disabled');
    expect(map.trust.visible).toBe(false);
    expect(map.trust.reason).toBe('runtime_visibility_disabled');
  });

  test('caps deferred sections by policy budget', () => {
    const lowPolicy = deriveHomepageMotionPolicy(
      makeMotionContext({ reducedMotion: true, deviceTier: 'low' }),
    );
    const highPolicy = deriveHomepageMotionPolicy(
      makeMotionContext({ reducedMotion: false, deviceTier: 'high' }),
    );

    const lowDecisions = deriveHomepageSectionDecisions(
      DEFAULT_RUNTIME_MARKETING.runtime,
      lowPolicy,
    );
    const highDecisions = deriveHomepageSectionDecisions(
      DEFAULT_RUNTIME_MARKETING.runtime,
      highPolicy,
    );

    const lowDeferred = lowDecisions.filter((decision) => decision.deferred).length;
    const highDeferred = highDecisions.filter((decision) => decision.deferred).length;

    expect(lowDeferred).toBeGreaterThanOrEqual(highDeferred);
  });

  test('summarizes decision outcomes', () => {
    const policy = deriveHomepageMotionPolicy(makeMotionContext());
    const decisions = deriveHomepageSectionDecisions(
      DEFAULT_RUNTIME_MARKETING.runtime,
      policy,
    );
    const summary = summarizeHomepageDecisions(decisions);

    expect(summary.totalVisible).toBeGreaterThan(10);
    expect(summary.totalDeferred).toBeGreaterThan(0);
    expect(summary.criticalVisible).toBe(4);
    expect(summary.nonCriticalVisible).toBeGreaterThan(summary.criticalVisible);
  });
});

describe('homepage-experience: helper utilities', () => {
  test('generates policy hints for disabled capabilities', () => {
    const batteryPolicy = deriveHomepageMotionPolicy(
      makeMotionContext({
        reducedMotion: true,
        saveDataEnabled: true,
        deviceTier: 'low',
      }),
    );

    const hints = getHomepagePolicyHints(batteryPolicy);
    expect(hints).toContain('performance_profile:battery_saver');
    expect(hints).toContain('intro_motion_disabled');
    expect(hints).toContain('orbital_motion_disabled');
    expect(hints).toContain('background_overlays_disabled');
    expect(hints).toContain('pulse_tokens_disabled');
  });

  test('sticky CTA visibility helper respects policy thresholds', () => {
    const policy = deriveHomepageMotionPolicy(makeMotionContext());

    expect(shouldStickyCtaBeVisible(policy.stickyCtaWindow.enter - 0.001, policy)).toBe(false);
    expect(shouldStickyCtaBeVisible(policy.stickyCtaWindow.enter + 0.01, policy)).toBe(true);
    expect(shouldStickyCtaBeVisible(policy.stickyCtaWindow.exit - 0.01, policy)).toBe(true);
    expect(shouldStickyCtaBeVisible(policy.stickyCtaWindow.exit + 0.001, policy)).toBe(false);
  });

  test('copy risk evaluator identifies long and offsite variants', () => {
    const riskyCopy = normalizeHeroCopy(
      {
        headlinePrimary: 'A'.repeat(70),
        headlineAccent: 'B'.repeat(65),
        subheadline: 'C'.repeat(260),
        primaryCtaLabel: 'D'.repeat(40),
        secondaryCtaHref: 'https://external.example.com/demo',
      },
      FALLBACK_HERO,
    );
    const risks = evaluateHeroCopyRisk(riskyCopy);
    const fields = risks.map((risk) => risk.field);

    expect(fields).toContain('headlinePrimary');
    expect(fields).toContain('headlineAccent');
    expect(fields).toContain('subheadline');
    expect(fields).toContain('primaryCtaLabel');
    expect(fields).toContain('secondaryCtaHref');
  });
});

describe('homepage-experience: policy matrix regression', () => {
  test.each([
    {
      name: 'high-tier, motion on',
      context: makeMotionContext({ deviceTier: 'high' }),
      expectedProfile: 'immersive',
      expectedOrbital: true,
      expectedTelemetry: true,
    },
    {
      name: 'mid-tier, motion on',
      context: makeMotionContext({ deviceTier: 'mid' }),
      expectedProfile: 'balanced',
      expectedOrbital: true,
      expectedTelemetry: true,
    },
    {
      name: 'low-tier, reduced motion',
      context: makeMotionContext({ deviceTier: 'low', reducedMotion: true }),
      expectedProfile: 'battery_saver',
      expectedOrbital: false,
      expectedTelemetry: false,
    },
    {
      name: 'save-data high tier',
      context: makeMotionContext({ deviceTier: 'high', saveDataEnabled: true }),
      expectedProfile: 'battery_saver',
      expectedOrbital: false,
      expectedTelemetry: false,
    },
    {
      name: 'page hidden high tier',
      context: makeMotionContext({ deviceTier: 'high', pageVisible: false }),
      expectedProfile: 'immersive',
      expectedOrbital: false,
      expectedTelemetry: false,
    },
  ])('$name', ({ context, expectedProfile, expectedOrbital, expectedTelemetry }) => {
    const policy = deriveHomepageMotionPolicy(context);
    expect(policy.performanceProfile).toBe(expectedProfile);
    expect(policy.allowOrbitalMotion).toBe(expectedOrbital);
    expect(policy.shouldTrackFineGrainedTelemetry).toBe(expectedTelemetry);
  });
});
