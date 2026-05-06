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
    badgeText: 'Compliance OS for NDIS, aged care & healthcare',
    headlinePrimary: 'Audit-ready every day,',
    headlineAccent: 'not the week before the Commission visits.',
    subheadline:
      'FormaOS turns NDIS Practice Standards, Aged Care Quality Standards, and the rest of your obligations into enforced workflows — with named owners, blocked failure paths, and an immutable evidence trail that passes Commission and accreditation review the first time.',
    primaryCtaLabel: 'Get Compliance Plan',
    primaryCtaHref: '/contact?type=compliance-plan&source=home_hero',
    secondaryCtaLabel: 'Book Demo',
    secondaryCtaHref: '/contact?type=demo&source=home_hero',
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
