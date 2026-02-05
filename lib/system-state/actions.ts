"use server";

import { 
  fetchSystemState, 
  calculateModuleState,
  validateModuleAccess,
  validatePermission,
  type SystemStatePayload 
} from "./server";
import type { ModuleId, UserEntitlements, NodeState, PlanTier, UserRole } from "./types";
import { PLAN_FEATURES, ROLE_PERMISSIONS } from "./types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * =========================================================
 * SYSTEM STATE SERVER ACTIONS
 * =========================================================
 * 
 * These actions provide the interface between the client-side
 * SystemStateProvider and the backend data sources.
 * 
 * CRITICAL: All state changes MUST go through these actions.
 * The client should never mutate state without backend confirmation.
 */

// =========================================================
// ACTION RESULT TYPES
// =========================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// =========================================================
// HYDRATION ACTIONS
// =========================================================

/**
 * Fetch the complete system state for initial hydration
 * This is called once when the app loads to initialize the context
 */
export async function getSystemState(): Promise<ActionResult<SystemStatePayload>> {
  try {
    const state = await fetchSystemState();
    
    if (!state) {
      return { success: false, error: "Not authenticated" };
    }

    return { success: true, data: state };
  } catch (error) {
    console.error("[getSystemState] Error:", error);
    return { success: false, error: "Failed to fetch system state" };
  }
}

/**
 * Get the current node state for a specific module
 * Use this for real-time state checks
 */
export async function getModuleNodeState(moduleId: ModuleId): Promise<ActionResult<NodeState>> {
  try {
    const { allowed, state, reason } = await validateModuleAccess(moduleId);
    return { success: true, data: state };
  } catch (error) {
    console.error("[getModuleNodeState] Error:", error);
    return { success: false, error: "Failed to get module state" };
  }
}

/**
 * Validate if a module can be accessed before performing an action
 */
export async function canAccessModule(moduleId: ModuleId): Promise<ActionResult<{
  allowed: boolean;
  state: NodeState;
  reason?: string;
}>> {
  try {
    const result = await validateModuleAccess(moduleId);
    return { success: true, data: result };
  } catch (error) {
    console.error("[canAccessModule] Error:", error);
    return { success: false, error: "Failed to validate access" };
  }
}

/**
 * Check if a permission is granted
 */
export async function checkPermission(
  permissionKey: keyof UserEntitlements["permissions"]
): Promise<ActionResult<boolean>> {
  try {
    const { allowed } = await validatePermission(permissionKey);
    return { success: true, data: allowed };
  } catch (error) {
    console.error("[checkPermission] Error:", error);
    return { success: false, error: "Failed to check permission" };
  }
}

// =========================================================
// PLAN UPGRADE ACTIONS
// =========================================================

/**
 * Initiate a plan upgrade
 * This creates a Stripe checkout session and returns the URL
 */
export async function initiatePlanUpgrade(targetPlan: PlanTier): Promise<ActionResult<{
  checkoutUrl?: string;
  requiresPayment: boolean;
}>> {
  try {
    const state = await fetchSystemState();
    if (!state) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if this is a valid upgrade
    const planOrder: PlanTier[] = ["trial", "basic", "pro", "enterprise"];
    const currentIndex = planOrder.indexOf(state.organization.plan);
    const targetIndex = planOrder.indexOf(targetPlan);

    if (targetIndex <= currentIndex) {
      return { success: false, error: "Invalid upgrade: target plan is not higher" };
    }

    // For enterprise, redirect to contact sales
    if (targetPlan === "enterprise") {
      return { 
        success: true, 
        data: { 
          checkoutUrl: "/contact?type=enterprise", 
          requiresPayment: true 
        } 
      };
    }

    // For basic/pro, create Stripe checkout session
    // Note: This would integrate with your existing billing flow
    // For now, return the billing page URL
    return { 
      success: true, 
      data: { 
        checkoutUrl: `/app/billing?upgrade=${targetPlan}`,
        requiresPayment: true 
      } 
    };
  } catch (error) {
    console.error("[initiatePlanUpgrade] Error:", error);
    return { success: false, error: "Failed to initiate upgrade" };
  }
}

/**
 * Confirm plan upgrade after payment
 * This is typically called from the Stripe webhook, but can also
 * be called manually for trial-to-paid conversions
 */
export async function confirmPlanUpgrade(
  orgId: string, 
  newPlan: PlanTier,
  stripeData?: {
    customerId: string;
    subscriptionId: string;
  }
): Promise<ActionResult> {
  try {
    const admin = createSupabaseAdminClient();
    
    // Map PlanTier back to PlanKey for database
    const planKeyMap: Record<PlanTier, string> = {
      trial: "basic", // Trial converts to basic
      basic: "basic",
      pro: "pro",
      enterprise: "enterprise",
    };

    // Legacy plan_code uses different values (starter vs basic)
    const toLegacyPlanCode = (key: string) => (key === "basic" ? "starter" : key);

    const now = new Date().toISOString();

    // Update subscription
    await admin.from("org_subscriptions").upsert({
      org_id: orgId, // Legacy column
      organization_id: orgId,
      plan_code: toLegacyPlanCode(planKeyMap[newPlan]), // Legacy column with different values
      plan_key: planKeyMap[newPlan],
      status: "active",
      stripe_customer_id: stripeData?.customerId,
      stripe_subscription_id: stripeData?.subscriptionId,
      trial_started_at: null, // Clear trial
      trial_expires_at: null,
      updated_at: now,
    });

    // Sync entitlements for the new plan
    // This would call your existing syncEntitlementsForPlan function
    revalidatePath("/app");
    
    return { success: true };
  } catch (error) {
    console.error("[confirmPlanUpgrade] Error:", error);
    return { success: false, error: "Failed to confirm upgrade" };
  }
}

// =========================================================
// ROLE CHANGE ACTIONS
// =========================================================

/**
 * Change a user's role within the organization
 * Requires MANAGE_USERS permission
 */
export async function changeUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<ActionResult> {
  try {
    const state = await fetchSystemState();
    if (!state) {
      return { success: false, error: "Not authenticated" };
    }

    // Check permission
    if (!state.entitlements.permissions.canManageTeam) {
      return { success: false, error: "Permission denied: cannot manage team" };
    }

    // Map UserRole to database role string
    const roleMap: Record<UserRole, string> = {
      viewer: "viewer",
      member: "staff",
      admin: "admin",
      owner: "owner",
    };

    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from("org_members")
      .update({ role: roleMap[newRole], updated_at: new Date().toISOString() })
      .eq("organization_id", state.organization.id)
      .eq("user_id", targetUserId);

    if (error) {
      console.error("[changeUserRole] DB Error:", error);
      return { success: false, error: "Failed to update role" };
    }

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    console.error("[changeUserRole] Error:", error);
    return { success: false, error: "Failed to change role" };
  }
}

// =========================================================
// MODULE ACTIVATION ACTIONS
// =========================================================

/**
 * Record module access for analytics and audit
 */
export async function recordModuleAccess(moduleId: ModuleId): Promise<ActionResult> {
  try {
    const { allowed, state, reason } = await validateModuleAccess(moduleId);
    
    if (!allowed) {
      return { success: false, error: reason };
    }

    // Log module access for analytics
    // This could write to an analytics table or external service
    const systemState = await fetchSystemState();
    if (systemState) {
      console.log(`[Module Access] User ${systemState.user.id} accessed ${moduleId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[recordModuleAccess] Error:", error);
    return { success: false, error: "Failed to record access" };
  }
}

/**
 * Get available modules for the current user
 * Returns list of modules with their states
 */
export async function getAvailableModules(): Promise<ActionResult<Array<{
  id: ModuleId;
  state: NodeState;
  accessible: boolean;
}>>> {
  try {
    const state = await fetchSystemState();
    if (!state) {
      return { success: false, error: "Not authenticated" };
    }

    const allModuleIds: ModuleId[] = [
      "controls", "evidence", "audits", "policies", "tasks",
      "vault", "reports", "registers", "team", "billing", "settings", "admin"
    ];

    const modules = allModuleIds.map(id => {
      const nodeState = calculateModuleState(
        id, 
        state.entitlements, 
        state.subscription?.status
      );
      
      return {
        id,
        state: nodeState,
        accessible: nodeState === "active",
      };
    });

    return { success: true, data: modules };
  } catch (error) {
    console.error("[getAvailableModules] Error:", error);
    return { success: false, error: "Failed to get modules" };
  }
}

// =========================================================
// SUBSCRIPTION STATUS ACTIONS
// =========================================================

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<ActionResult<{
  plan: PlanTier;
  status: string;
  trialActive: boolean;
  trialDaysRemaining: number;
  billingUrl?: string;
}>> {
  try {
    const state = await fetchSystemState();
    if (!state) {
      return { success: false, error: "Not authenticated" };
    }

    return {
      success: true,
      data: {
        plan: state.organization.plan,
        status: state.subscription?.status ?? "unknown",
        trialActive: state.entitlements.trialActive,
        trialDaysRemaining: state.entitlements.trialDaysRemaining,
        billingUrl: "/app/billing",
      },
    };
  } catch (error) {
    console.error("[getSubscriptionStatus] Error:", error);
    return { success: false, error: "Failed to get subscription status" };
  }
}

// Re-export for convenience
export { fetchSystemState };
