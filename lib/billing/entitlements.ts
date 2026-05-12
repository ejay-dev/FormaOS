import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { PLAN_CATALOG, PlanKey, resolvePlanKey } from '@/lib/plans';

export type EntitlementKey =
  | 'audit_export'
  | 'reports'
  | 'framework_evaluations'
  | 'certifications'
  | 'team_limit'
  | 'ai_assistant'
  | 'capa_management'
  | 'custom_reports'
  | 'form_analytics'
  | 'workflow_automation'
  | 'sso_saml'
  | 'directory_sync'
  | 'retention_governance';

export type PlanEntitlementDefinition = {
  enabled: EntitlementKey[];
  limits: Record<string, number | null>;
};

export const PLAN_ENTITLEMENTS: Record<PlanKey, PlanEntitlementDefinition> = {
  basic: {
    enabled: ['audit_export', 'reports', 'framework_evaluations', 'team_limit'],
    limits: {
      team_limit: PLAN_CATALOG.basic.limits.maxUsers as number,
    },
  },
  pro: {
    enabled: [
      'audit_export',
      'reports',
      'framework_evaluations',
      'certifications',
      'team_limit',
      'ai_assistant',
      'capa_management',
      'custom_reports',
      'form_analytics',
    ],
    limits: {
      team_limit: PLAN_CATALOG.pro.limits.maxUsers as number,
    },
  },
  scale: {
    enabled: [
      'audit_export',
      'reports',
      'framework_evaluations',
      'certifications',
      'team_limit',
      'ai_assistant',
      'capa_management',
      'custom_reports',
      'form_analytics',
      'workflow_automation',
    ],
    limits: {
      team_limit: PLAN_CATALOG.scale.limits.maxUsers as number,
    },
  },
  enterprise: {
    enabled: [
      'audit_export',
      'reports',
      'framework_evaluations',
      'certifications',
      'team_limit',
      'ai_assistant',
      'capa_management',
      'custom_reports',
      'form_analytics',
      'workflow_automation',
      'sso_saml',
      'directory_sync',
      'retention_governance',
    ],
    limits: {
      team_limit: null, // unlimited
    },
  },
};

export async function requireActiveSubscription(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('org_subscriptions')
    .select('plan_key, status, current_period_end, trial_expires_at')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) {
    throw new Error('Subscription lookup failed');
  }

  if (
    !data?.status ||
    !['active', 'trialing', 'pending_checkout'].includes(data.status)
  ) {
    throw new Error('Subscription inactive');
  }

  // pending_checkout is the post-bootstrap, pre-payment grace window for
  // self-serve plans. trialing is reserved for plans that genuinely have a
  // free trial. Both honor trial_expires_at as the deadline.
  if (data.status === 'trialing' || data.status === 'pending_checkout') {
    const deadlineValue =
      (data as { trial_expires_at?: string | null }).trial_expires_at ??
      data.current_period_end;
    if (!deadlineValue) {
      throw new Error('Subscription grace period expired');
    }
    const deadline = new Date(deadlineValue).getTime();
    if (Number.isNaN(deadline) || Date.now() > deadline) {
      throw new Error('Subscription grace period expired');
    }
  }

  const planKey = resolvePlanKey(data.plan_key);
  if (!planKey) {
    throw new Error('Subscription plan invalid');
  }

  return { planKey, status: data.status };
}

export async function requireEntitlement(
  orgId: string,
  featureKey: EntitlementKey,
) {
  await requireActiveSubscription(orgId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', orgId)
    .eq('feature_key', featureKey)
    .maybeSingle();

  if (error) {
    throw new Error('Entitlement lookup failed');
  }

  if (!data?.enabled) {
    throw new Error(`Entitlement blocked: ${featureKey}`);
  }
}

export async function getEntitlementLimit(
  orgId: string,
  featureKey: EntitlementKey,
) {
  await requireActiveSubscription(orgId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('org_entitlements')
    .select('enabled, limit_value')
    .eq('organization_id', orgId)
    .eq('feature_key', featureKey)
    .maybeSingle();

  if (error) {
    throw new Error('Entitlement lookup failed');
  }

  if (!data?.enabled) {
    throw new Error(`Entitlement blocked: ${featureKey}`);
  }

  return data.limit_value ?? null;
}

export async function syncEntitlementsForPlan(orgId: string, planKey: PlanKey) {
  const admin = createSupabaseAdminClient();
  const plan = PLAN_ENTITLEMENTS[planKey];

  const enabledRecords = plan.enabled.map((featureKey) => ({
    organization_id: orgId,
    feature_key: featureKey,
    enabled: true,
    limit_value: plan.limits[featureKey] ?? null,
  }));

  const limitRecords = Object.entries(plan.limits)
    .filter(
      ([featureKey]) => !plan.enabled.includes(featureKey as EntitlementKey),
    )
    .map(([featureKey, limit]) => ({
      organization_id: orgId,
      feature_key: featureKey,
      enabled: true,
      limit_value: limit,
    }));

  const records = [...enabledRecords, ...limitRecords];
  if (records.length === 0) return;

  await admin.from('org_entitlements').upsert(records, {
    onConflict: 'organization_id,feature_key',
  });
}
