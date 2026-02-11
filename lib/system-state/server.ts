import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolvePlanKey, type PlanKey } from '@/lib/plans';
import { normalizeRole, type RoleKey } from '@/app/app/actions/rbac';
import {
  ensureOrgProvisioning,
  ensureUserProvisioning,
} from '@/lib/provisioning/ensure-provisioning';
import type {
  PlanTier,
  UserRole,
  ModuleId,
  UserEntitlements,
  NodeState,
} from './types';
import { PLAN_FEATURES, ROLE_PERMISSIONS, MODULE_DEFINITIONS } from './types';

/**
 * =========================================================
 * SYSTEM STATE SERVER-SIDE DATA LAYER
 * =========================================================
 *
 * This module fetches real backend data to hydrate the system
 * state engine. All data comes from:
 * - Supabase auth (user)
 * - org_members (role, organization)
 * - org_subscriptions (plan, trial status)
 * - org_entitlements (feature access)
 *
 * CRITICAL: This is the single source of truth for system state.
 * The client-side context should only reflect what this returns.
 */

// =========================================================
// TYPE MAPPINGS
// =========================================================

/**
 * Map backend PlanKey to system-state PlanTier
 */
export function mapPlanKeyToTier(planKey?: string | null): PlanTier {
  const resolved = resolvePlanKey(planKey ?? null);
  if (!resolved) return 'trial';

  switch (resolved) {
    case 'basic':
      return 'basic';
    case 'pro':
      return 'pro';
    case 'enterprise':
      return 'enterprise';
    default:
      return 'trial';
  }
}

/**
 * Map backend RoleKey to system-state UserRole
 */
export function mapRoleKeyToUserRole(roleKey: RoleKey): UserRole {
  switch (roleKey) {
    case 'OWNER':
      return 'owner';
    case 'COMPLIANCE_OFFICER':
    case 'MANAGER':
      return 'admin';
    case 'STAFF':
    case 'AUDITOR':
      return 'member';
    case 'VIEWER':
      return 'viewer';
    default:
      return 'member';
  }
}

/**
 * Map system-state UserRole back to backend RoleKey
 */
export function mapUserRoleToRoleKey(userRole: UserRole): RoleKey {
  switch (userRole) {
    case 'owner':
      return 'OWNER';
    case 'admin':
      return 'COMPLIANCE_OFFICER';
    case 'member':
      return 'STAFF';
    case 'viewer':
      return 'VIEWER';
  }
}

// =========================================================
// SUBSCRIPTION DATA
// =========================================================

export interface SubscriptionData {
  planKey: PlanKey | null;
  planTier: PlanTier;
  status: 'pending' | 'trialing' | 'active' | 'past_due' | 'canceled';
  trialActive: boolean;
  trialDaysRemaining: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
}

export async function getSubscriptionData(
  orgId: string,
): Promise<SubscriptionData | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('org_subscriptions')
    .select(
      `
      plan_key,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      current_period_end,
      trial_started_at,
      trial_expires_at
    `,
    )
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const planKey = resolvePlanKey(data.plan_key);
  const planTier = mapPlanKeyToTier(data.plan_key);
  const status = (data.status as SubscriptionData['status']) || 'pending';

  // Calculate trial state
  let trialActive = false;
  let trialDaysRemaining = 0;

  if (status === 'trialing' && data.trial_expires_at) {
    const trialEnd = new Date(data.trial_expires_at);
    const now = new Date();
    trialActive = now < trialEnd;
    trialDaysRemaining = trialActive
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  }

  return {
    planKey,
    planTier,
    status,
    trialActive,
    trialDaysRemaining,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
    currentPeriodEnd: data.current_period_end
      ? new Date(data.current_period_end)
      : null,
  };
}

// =========================================================
// ENTITLEMENT DATA
// =========================================================

export interface EntitlementData {
  featureKey: string;
  enabled: boolean;
  limitValue: number | null;
}

export async function getEntitlements(
  orgId: string,
): Promise<EntitlementData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('org_entitlements')
    .select('feature_key, enabled, limit_value')
    .eq('organization_id', orgId);

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    featureKey: row.feature_key,
    enabled: row.enabled ?? false,
    limitValue: row.limit_value ?? null,
  }));
}

// =========================================================
// MEMBERSHIP DATA
// =========================================================

export interface MembershipData {
  userId: string;
  orgId: string;
  role: RoleKey;
  userRole: UserRole;
  organizationName: string;
  onboardingCompleted: boolean;
  industry: string | null;
}

function pickPrimaryMembership<
  T extends {
    role?: string | null;
    organization_id?: string | null;
  },
>(memberships: T[]): T | null {
  if (!memberships.length) return null;
  const weight = (role?: string | null) => {
    const normalized = (role ?? '').toLowerCase();
    if (normalized === 'owner') return 3;
    if (normalized === 'admin') return 2;
    return 1;
  };
  return (
    memberships
      .slice()
      .sort((a, b) => weight(b.role) - weight(a.role))
      .at(0) ??
    memberships[0]
  );
}

export async function getMembershipData(): Promise<MembershipData | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membershipRows, error } = await supabase
    .from('org_members')
    .select(
      `
      organization_id,
      role,
      organizations:organization_id (
        name,
        onboarding_completed,
        industry
      )
    `,
    )
    .eq('user_id', user.id)
    .limit(50);

  const membership = pickPrimaryMembership((membershipRows ?? []) as any[]);

  if (error || !membership?.organization_id) {
    return null;
  }

  const org = membership.organizations as any;
  const roleKey = normalizeRole(membership.role as string | null);

  return {
    userId: user.id,
    orgId: membership.organization_id as string,
    role: roleKey,
    userRole: mapRoleKeyToUserRole(roleKey),
    organizationName: org?.name ?? 'Unknown Organization',
    onboardingCompleted: org?.onboarding_completed ?? false,
    industry: org?.industry ?? null,
  };
}

// =========================================================
// FULL SYSTEM STATE PAYLOAD
// =========================================================

export interface SystemStatePayload {
  user: {
    id: string;
    email: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    plan: PlanTier;
    onboardingCompleted: boolean;
    industry: string | null;
  };
  role: UserRole;
  entitlements: UserEntitlements;
  subscription: SubscriptionData | null;
  isFounder: boolean;
}

/**
 * Fetch complete system state from backend
 * This is the primary data source for the SystemStateProvider
 *
 * @param preloadedUser - Optional user object to avoid duplicate getUser() calls
 */
export async function fetchSystemState(preloadedUser?: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<SystemStatePayload | null> {
  const supabase = await createSupabaseServerClient();

  // Use preloaded user if provided, otherwise fetch
  let user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null = preloadedUser ?? null;
  if (!user) {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser ?? null;
  }
  if (!user) return null;

  // Get membership data
  let membership = await getMembershipData();
  if (!membership) {
    try {
      await ensureUserProvisioning({
        userId: user.id,
        email: user.email ?? null,
      });
    } catch (err) {
      console.error('[fetchSystemState] ensureUserProvisioning failed:', err);
    }
    membership = await getMembershipData();
  }
  if (!membership) return null;

  // Get subscription + entitlements in parallel
  let [subscription, dbEntitlements] = await Promise.all([
    getSubscriptionData(membership.orgId),
    getEntitlements(membership.orgId),
  ]);
  let planTier = subscription?.planTier ?? 'trial';
  let trialActive = subscription?.trialActive ?? false;
  let trialDaysRemaining = subscription?.trialDaysRemaining ?? 0;

  const resolvedPlanForEntitlements = resolvePlanKey(
    subscription?.planKey ?? null,
  );
  const needsEntitlements =
    resolvedPlanForEntitlements === 'basic' ||
    resolvedPlanForEntitlements === 'pro';
  const needsRepair =
    !subscription || (needsEntitlements && dbEntitlements.length === 0);

  if (needsRepair) {
    try {
      await ensureOrgProvisioning({
        orgId: membership.orgId,
        planKey: subscription?.planKey ?? null,
        ownerUserId: membership.userId,
        orgName: membership.organizationName,
      });
    } catch (err) {
      console.error('[fetchSystemState] ensureOrgProvisioning failed:', err);
    }
    subscription = await getSubscriptionData(membership.orgId);
    planTier = subscription?.planTier ?? planTier;
    trialActive = subscription?.trialActive ?? trialActive;
    trialDaysRemaining = subscription?.trialDaysRemaining ?? trialDaysRemaining;
    dbEntitlements = await getEntitlements(membership.orgId);
  }

  // Check if founder
  const parseEnvList = (value?: string | null) =>
    new Set(
      (value ?? '')
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    );

  const founderEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const founderIds = parseEnvList(process.env.FOUNDER_USER_IDS);
  const userEmail = (user.email ?? '').trim().toLowerCase();
  const userId = user.id.toLowerCase();
  const isFounder =
    (userEmail && founderEmails.has(userEmail)) || founderIds.has(userId);

  // Build enabled modules list based on plan + entitlements
  const planModules = PLAN_FEATURES[planTier];
  const enabledModules = planModules.filter((moduleId) => {
    // Check if module has a corresponding entitlement override
    const entitlement = dbEntitlements.find(
      (e) => e.featureKey.toLowerCase() === moduleId.toLowerCase(),
    );
    // If entitlement exists and is disabled, exclude the module
    if (entitlement && !entitlement.enabled) return false;
    return true;
  });

  // Build permissions based on role
  const rolePermissions = ROLE_PERMISSIONS[membership.userRole];

  // Build full entitlements object
  let entitlements: UserEntitlements;

  if (isFounder) {
    // 🚨 FOUNDER PRIVILEGES: Bypass all restrictions
    entitlements = {
      plan: 'enterprise', // Founders get enterprise-level access
      role: 'owner', // Founders are always owners
      trialActive: false, // Founders don't have trial limitations
      trialDaysRemaining: 0,
      enabledModules: MODULE_DEFINITIONS.map((mod) => mod.id) as ModuleId[], // All modules
      permissions: {
        // Grant all permissions to founders
        canCreatePolicies: true,
        canManageTeam: true,
        canViewAudit: true,
        canExportReports: true,
        canManageBilling: true,
        canAccessAdmin: true,
        canEditSettings: true,
      },
    };
  } else {
    // Regular user entitlements
    entitlements = {
      plan: planTier,
      role: membership.userRole,
      trialActive,
      trialDaysRemaining,
      enabledModules: enabledModules as ModuleId[],
      permissions: rolePermissions,
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      name:
        (typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : null) ??
        user.email?.split('@')[0] ??
        'User',
    },
    organization: {
      id: membership.orgId,
      name: membership.organizationName,
      plan: planTier,
      onboardingCompleted: membership.onboardingCompleted,
      industry: membership.industry,
    },
    role: membership.userRole,
    entitlements,
    subscription,
    isFounder,
  };
}

// =========================================================
// MODULE STATE CALCULATION (SERVER-SIDE)
// =========================================================

/**
 * Calculate node state based on real backend data
 * This ensures UI state is always derived from backend truth
 */
export function calculateModuleState(
  moduleId: ModuleId,
  entitlements: UserEntitlements,
  subscriptionStatus?: SubscriptionData['status'],
  isFounder?: boolean,
): NodeState {
  const moduleDef = MODULE_DEFINITIONS.find((m) => m.id === moduleId);
  if (!moduleDef) return 'locked';

  // 🚨 FOUNDER BYPASS: Founders have access to everything
  if (isFounder) {
    return 'active';
  }

  // Check if subscription is in a blocked state
  if (subscriptionStatus === 'past_due') {
    return 'restricted';
  }
  if (subscriptionStatus === 'canceled' || subscriptionStatus === 'pending') {
    return 'locked';
  }

  // Check if trial has expired
  if (entitlements.trialActive && entitlements.trialDaysRemaining <= 0) {
    return 'locked';
  }

  // Check if module is enabled for this plan
  const planModules = PLAN_FEATURES[entitlements.plan];
  if (!planModules.includes(moduleId)) {
    return 'locked';
  }

  // Check role requirements
  const roleOrder: UserRole[] = ['viewer', 'member', 'admin', 'owner'];
  const requiredRoleIndex = roleOrder.indexOf(moduleDef.requiredRole);
  const userRoleIndex = roleOrder.indexOf(entitlements.role);

  if (userRoleIndex < requiredRoleIndex) {
    return 'restricted';
  }

  // Module is accessible
  return 'active';
}

/**
 * Calculate all module states for the current user
 */
export function calculateAllModuleStates(
  entitlements: UserEntitlements,
  subscriptionStatus?: SubscriptionData['status'],
  isFounder?: boolean,
): Map<ModuleId, NodeState> {
  const states = new Map<ModuleId, NodeState>();

  for (const moduleDef of MODULE_DEFINITIONS) {
    const state = calculateModuleState(
      moduleDef.id,
      entitlements,
      subscriptionStatus,
      isFounder,
    );
    states.set(moduleDef.id, state);
  }

  return states;
}

// =========================================================
// VALIDATION HELPERS
// =========================================================

/**
 * Validate that a module can be accessed
 * Use this in server actions before performing module-specific operations
 */
export async function validateModuleAccess(moduleId: ModuleId): Promise<{
  allowed: boolean;
  state: NodeState;
  reason?: string;
}> {
  const systemState = await fetchSystemState();

  if (!systemState) {
    return { allowed: false, state: 'locked', reason: 'Not authenticated' };
  }

  // 🚨 FOUNDER BYPASS: Founders can access everything
  if (systemState.isFounder) {
    return { allowed: true, state: 'active' };
  }

  const state = calculateModuleState(
    moduleId,
    systemState.entitlements,
    systemState.subscription?.status,
    systemState.isFounder,
  );

  if (state === 'locked') {
    return {
      allowed: false,
      state,
      reason: 'Module not available on current plan',
    };
  }

  if (state === 'restricted') {
    return { allowed: false, state, reason: 'Insufficient permissions' };
  }

  return { allowed: true, state };
}

/**
 * Validate that a permission is granted
 * Use this in server actions before performing permission-gated operations
 */
export async function validatePermission(
  permissionKey: keyof UserEntitlements['permissions'],
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const systemState = await fetchSystemState();

  if (!systemState) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // 🚨 FOUNDER BYPASS: Founders have all permissions
  if (systemState.isFounder) {
    return { allowed: true };
  }

  const hasPermission = systemState.entitlements.permissions[permissionKey];

  if (!hasPermission) {
    return { allowed: false, reason: `Permission denied: ${permissionKey}` };
  }

  return { allowed: true };
}
