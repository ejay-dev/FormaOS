import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
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

/**
 * v4-031: entitlements safe to grant during the `pending_checkout`
 * grace window. The status sits between "user clicked Subscribe" and
 * "Stripe webhook arrived" — usually under 60s, occasionally longer
 * if Stripe is slow or the webhook is briefly stuck. Granting full
 * Pro for up to PENDING_CHECKOUT_GRACE_DAYS (default 1 day) lets a
 * user click Subscribe, abandon, and use Pro for a day with zero
 * payment.
 *
 * Read/reporting entitlements are safe during grace — they don't
 * burn variable cost (no LLM calls, no Stripe API, no export queue).
 * AI, automation, exec/custom reports, SSO and retention all
 * involve either real spend or contractually-billable surfaces;
 * gate those behind a confirmed webhook landing.
 */
const PENDING_CHECKOUT_GRACE_ENTITLEMENTS: ReadonlySet<EntitlementKey> =
  new Set([
    'audit_export',
    'reports',
    'framework_evaluations',
    'certifications',
    'team_limit',
    'form_analytics',
  ]);

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
  const { status } = await requireActiveSubscription(orgId);
  // v4-031: pending_checkout grace gates write-tier features.
  if (
    status === 'pending_checkout' &&
    !PENDING_CHECKOUT_GRACE_ENTITLEMENTS.has(featureKey)
  ) {
    throw new Error(
      `Entitlement requires confirmed subscription: ${featureKey}`,
    );
  }
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
  const { status } = await requireActiveSubscription(orgId);
  if (
    status === 'pending_checkout' &&
    !PENDING_CHECKOUT_GRACE_ENTITLEMENTS.has(featureKey)
  ) {
    throw new Error(
      `Entitlement requires confirmed subscription: ${featureKey}`,
    );
  }
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

/**
 * Tear down every entitlement row for an org. Used on
 * `customer.subscription.deleted` so the org's status going to
 * `canceled` is mirrored by every defense-in-depth check that
 * reads `org_entitlements.enabled` directly (pages under
 * /app/billing, /app/reports, /app/workflows, etc.) — not just
 * the requireEntitlement() guards that also call
 * requireActiveSubscription().
 *
 * Leaves rows in place (with enabled=false) so re-subscribing
 * via syncEntitlementsForPlan re-toggles them with their stored
 * onConflict id, instead of orphaning customer history.
 */
export async function disableEntitlementsForOrg(orgId: string) {
  const supabase = createSupabaseOrgClient(orgId);
  await supabase
    .from('org_entitlements')
    .update({ enabled: false, updated_at: new Date().toISOString() });
}

export async function syncEntitlementsForPlan(orgId: string, planKey: PlanKey) {
  const supabase = createSupabaseOrgClient(orgId);
  const plan = PLAN_ENTITLEMENTS[planKey];

  // The wrapper stamps organization_id on every record automatically.
  const enabledRecords = plan.enabled.map((featureKey) => ({
    feature_key: featureKey,
    enabled: true,
    limit_value: plan.limits[featureKey] ?? null,
  }));

  const limitRecords = Object.entries(plan.limits)
    .filter(
      ([featureKey]) => !plan.enabled.includes(featureKey as EntitlementKey),
    )
    .map(([featureKey, limit]) => ({
      feature_key: featureKey,
      enabled: true,
      limit_value: limit,
    }));

  const records = [...enabledRecords, ...limitRecords];
  if (records.length === 0) return;

  await supabase.from('org_entitlements').upsert(records, {
    onConflict: 'organization_id,feature_key',
  });
}
