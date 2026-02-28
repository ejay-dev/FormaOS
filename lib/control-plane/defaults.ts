import type {
  ControlPlaneEnvironment,
  RuntimeMarketingConfig,
  RuntimeOpsConfig,
} from '@/lib/control-plane/types';

export const DEFAULT_CONTROL_ENVIRONMENT: ControlPlaneEnvironment =
  process.env.VERCEL_ENV === 'production'
    ? 'production'
    : process.env.VERCEL_ENV === 'preview'
      ? 'preview'
      : 'development';

export const DEFAULT_RUNTIME_VERSION = '1';

export const DEFAULT_RUNTIME_OPS: RuntimeOpsConfig = {
  maintenanceMode: false,
  readOnlyMode: false,
  emergencyLockdown: false,
  rateLimitMultiplier: 1,
};

export const DEFAULT_RUNTIME_MARKETING: RuntimeMarketingConfig = {
  hero: {
    badgeText: 'Enterprise Compliance Platform',
    headlinePrimary: 'Compliance Operations,',
    headlineAccent: 'Engineered for Regulated Teams',
    subheadline:
      'Unify governance, controls, evidence, and audit defense in one operational system.',
    primaryCtaLabel: 'Start Free Trial',
    primaryCtaHref: '/auth/signup?plan=pro',
    secondaryCtaLabel: 'Request Demo',
    secondaryCtaHref: '/contact',
  },
  runtime: {
    expensiveEffectsEnabled: true,
    activeShowcaseModule: 'interactive_demo',
    showcaseModules: {
      interactive_demo: true,
      evidence_showcase: true,
      task_showcase: true,
    },
    sectionVisibility: {
      value_proposition: true,
      compliance_network: true,
      interactive_demo: true,
      scroll_story: true,
      compliance_engine_demo: true,
      capabilities_grid: true,
      evidence_showcase: true,
      industries: true,
      task_showcase: true,
      security: true,
      outcome_proof: true,
      objection_handling: true,
      procurement_flow: true,
      cta: true,
      trust: true,
    },
    themeVariant: 'default',
    backgroundVariant: 'aurora',
  },
};

export const ADMIN_AUTOMATION_ACTIONS = [
  'run_cleanup',
  'rebuild_search_index',
  'recompute_scores',
  'regenerate_trust_packet',
  'flush_cache',
  'warm_cdn',
] as const;

export type AdminAutomationAction = (typeof ADMIN_AUTOMATION_ACTIONS)[number];

export const INTEGRATION_KEYS = [
  'google_drive',
  'google_calendar',
  'google_gmail',
] as const;
