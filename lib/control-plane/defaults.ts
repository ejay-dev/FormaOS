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
    badgeText: 'Compliance Operating System',
    headlinePrimary: 'Compliance That Runs Itself',
    headlineAccent: 'So Your Team Can Run the Business',
    subheadline:
      'FormaOS turns regulatory obligations into governed workflows with named owners, immutable evidence chains, and audit-ready assurance — across every framework your team operates under.',
    primaryCtaLabel: 'Start Free Trial',
    primaryCtaHref: '/auth/signup?plan=pro',
    secondaryCtaLabel: 'Talk to Sales',
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
      scroll_story: false,
      compliance_engine_demo: false,
      capabilities_grid: false,
      evidence_showcase: false,
      industries: true,
      task_showcase: false,
      security: true,
      outcome_proof: true,
      objection_handling: false,
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
