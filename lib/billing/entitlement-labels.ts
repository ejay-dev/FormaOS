/**
 * Human labels for org_entitlements.feature_key values.
 *
 * Client components import this, so it must stay free of the server Supabase
 * client — keep it to plain data. Keys mirror EntitlementKey in
 * lib/billing/entitlements.ts, which cannot be imported here for that reason.
 */

export type EntitlementLabel = {
  name: string;
  description: string;
};

export const ENTITLEMENT_LABELS: Record<string, EntitlementLabel> = {
  audit_export: {
    name: 'Audit export',
    description: 'Export audit trails and evidence packs.',
  },
  reports: {
    name: 'Standard reports',
    description: 'Built-in compliance and activity reporting.',
  },
  framework_evaluations: {
    name: 'Framework evaluations',
    description: 'Automated control checks against your installed packs.',
  },
  certifications: {
    name: 'Certifications',
    description: 'Track staff certifications and expiry dates.',
  },
  team_limit: {
    name: 'Team members',
    description: 'People you can invite to this workspace.',
  },
  ai_assistant: {
    name: 'AI assistant',
    description: 'Ask questions about your controls, policies and evidence.',
  },
  capa_management: {
    name: 'Corrective actions',
    description: 'Log corrective actions with an owner and a due date.',
  },
  custom_reports: {
    name: 'Custom reports',
    description: 'Build reports from your own filters and fields.',
  },
  form_analytics: {
    name: 'Form analytics',
    description: 'Completion and response trends across your forms.',
  },
  workflow_automation: {
    name: 'Workflow automation',
    description: 'Scheduled and triggered actions across tasks and evidence.',
  },
  sso_saml: {
    name: 'Single sign-on',
    description: 'Sign in through your SAML identity provider.',
  },
  directory_sync: {
    name: 'Directory sync',
    description: 'Keep workspace members in step with your directory.',
  },
  retention_governance: {
    name: 'Retention governance',
    description: 'Retention policies and legal holds.',
  },
};

export function describeEntitlement(featureKey: string): EntitlementLabel {
  const known = ENTITLEMENT_LABELS[featureKey];
  if (known) return known;

  const humanised = featureKey.replaceAll('_', ' ').trim();
  if (!humanised) {
    return { name: 'Workspace feature', description: '' };
  }

  return {
    name: humanised.charAt(0).toUpperCase() + humanised.slice(1),
    description: '',
  };
}

export function entitlementName(featureKey: string): string {
  return describeEntitlement(featureKey).name;
}
