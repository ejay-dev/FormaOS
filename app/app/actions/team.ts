"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/app/app/actions/audit";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { getEntitlementLimit } from "@/lib/billing/entitlements";

/**
 * ✅ INVITE MEMBER (Direct Argument Version - NEW)
 * Optimized for Client Components (Modal/Sheet) using React Hook Form.
 */
export async function inviteMember(email: string, role: string) {
  const supabase = await createSupabaseServerClient();

  // 1. Auth Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const permissionCtx = await requirePermission("MANAGE_USERS");

  // 2. Context & Privilege Check
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization context lost.");
  }

  const limit = await getEntitlementLimit(permissionCtx.orgId, "team_limit");
  if (limit) {
    const { count } = await supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", permissionCtx.orgId);

    if ((count ?? 0) >= limit) {
      throw new Error("Team limit reached for current plan.");
    }
  }

  // 3. Send Invite via Supabase Auth
  const { data: inviteData, error: inviteError } = await supabase
    .auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: membership.organization_id,
        role: role, // Stored in metadata for auto-assignment on login
        invited_by: user.id
      }
    });

  if (inviteError) {
    console.error("Invite Error:", inviteError);
    return { success: false, error: inviteError.message };
  }

  // 4. ✅ SECURITY LOGGING
  await logActivity(membership.organization_id, "INVITE_USER", {
    resourceName: email,
    event: "Security access granted (Invitation)",
    assignedRole: role,
    inviteId: inviteData.user.id
  });

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "user",
    entityId: inviteData.user.id,
    actionType: "USER_INVITED",
    afterState: { email, role },
    reason: "invite",
  });

  revalidatePath("/app/team");
  return { success: true };
}

/**
 * ✅ INVITE TEAM MEMBER (FormData Version - LEGACY/FALLBACK)
 * Kept for compatibility with standard HTML forms if needed.
 */
export async function inviteTeamMember(formData: FormData) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  
  // Re-use the core logic above
  return await inviteMember(email, role);
}

/**
 * ✅ REMOVE MEMBER ACTION
 * Revokes access and logs the termination event.
 */
export async function removeTeamMember(targetUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const permissionCtx = await requirePermission("MANAGE_USERS");

  // 1. Verify Admin Status
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Access Denied");
  }

  // 2. Fetch Target Details (Before deletion, for Logging)
  const { data: targetMember } = await supabase
    .from("org_members")
    .select("role") 
    .eq("user_id", targetUserId)
    .eq("organization_id", membership.organization_id)
    .single();

  if (!targetMember) return { success: false, error: "User not found" };

  // 3. Execute Removal
  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("user_id", targetUserId)
    .eq("organization_id", membership.organization_id);

  if (error) {
    console.error("Removal Error:", error);
    return { success: false, error: error.message };
  }

  // 4. ✅ AUDIT LOGGING (Termination Event)
  await logActivity(membership.organization_id, "REMOVE_USER", {
    resourceName: targetUserId, // If you have the email, use that instead for clarity
    event: "Access revoked (Termination)",
    previousRole: targetMember.role
  });

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "user",
    entityId: targetUserId,
    actionType: "USER_REMOVED",
    beforeState: { role: targetMember.role },
    reason: "removal",
  });

  revalidatePath("/app/team");
  return { success: true };
}
