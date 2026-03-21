"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/app/app/actions/audit";
import { logActivity as logProductActivity } from "@/lib/activity/feed";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { getEntitlementLimit } from "@/lib/billing/entitlements";
import { createInvitation } from "@/lib/invitations/create-invitation";
import { sendEmail } from "@/lib/email/send-email";
import { findAuthUserByEmail } from "@/lib/users/admin-profile-directory";

const VALID_INVITE_ROLES = new Set(["admin", "member", "viewer"]);

type InviteMemberResult =
  | {
      success: true;
      delivery: "sent" | "manual_share_required";
      inviteId: string;
      inviteUrl: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * ✅ INVITE MEMBER (Direct Argument Version - NEW)
 * Optimized for Client Components (Modal/Sheet) using React Hook Form.
 */
export async function inviteMember(email: string, role: string): Promise<InviteMemberResult> {
  const supabase = await createSupabaseServerClient();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }

  if (!VALID_INVITE_ROLES.has(normalizedRole)) {
    return { success: false, error: "Invalid role selected." };
  }

  // 1. Auth Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const permissionCtx = await requirePermission("MANAGE_USERS");

  // 2. Context & Privilege Check
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization context lost.");
  }

  const limit = await getEntitlementLimit(permissionCtx.orgId, "team_limit");
  if (limit) {
    const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
      supabase
        .from("org_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", permissionCtx.orgId),
      supabase
        .from("team_invitations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", permissionCtx.orgId)
        .eq("status", "pending"),
    ]);

    if ((memberCount ?? 0) + (inviteCount ?? 0) >= limit) {
      throw new Error("Team limit reached for current plan.");
    }
  }

  if (user.email?.toLowerCase() === normalizedEmail) {
    return { success: false, error: "You are already a member of this organization." };
  }

  const { data: existingInvite } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("organization_id", permissionCtx.orgId)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite?.id) {
    return { success: false, error: "Invitation already sent to this email." };
  }

  const profile = await findAuthUserByEmail(normalizedEmail);

  if (profile?.id) {
    const { data: existingMember } = await supabase
      .from("org_members")
      .select("id")
      .eq("organization_id", permissionCtx.orgId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingMember?.id) {
      return { success: false, error: "This user is already a member of the organization." };
    }
  }

  const invitationResult = await createInvitation({
    organizationId: permissionCtx.orgId,
    email: normalizedEmail,
    role: normalizedRole as "admin" | "member" | "viewer",
    invitedBy: user.id,
  });

  if (!invitationResult.success || !invitationResult.data) {
    const errorMessage =
      invitationResult.error instanceof Error
        ? invitationResult.error.message
        : "Failed to create invitation.";
    return { success: false, error: errorMessage };
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", permissionCtx.orgId)
    .maybeSingle();

  const inviteBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://app.formaos.com.au";
  const inviteUrl = `${inviteBase.replace(/\/$/, "")}/accept-invite/${invitationResult.data.token}`;
  const inviterName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "A team member";
  const inviterEmail = user.email ?? process.env.SUPPORT_EMAIL ?? "Formaos.team@gmail.com";

  const emailResult = await sendEmail({
    type: "invite",
    to: normalizedEmail,
    inviterName,
    inviterEmail,
    organizationName: organization?.name || "Organization",
    inviteUrl,
    role: normalizedRole,
    organizationId: permissionCtx.orgId,
    userId: user.id,
  });

  const delivery = emailResult.success ? "sent" : "manual_share_required";

  await logActivity(membership.organization_id, "INVITE_USER", {
    resourceName: normalizedEmail,
    event:
      delivery === "sent"
        ? "Invitation created and email sent"
        : "Invitation created; manual share required",
    assignedRole: normalizedRole,
    inviteId: invitationResult.data.id,
    delivery,
  });

  await logProductActivity(
    membership.organization_id,
    user.id,
    "created",
    {
      type: "invitation",
      id: invitationResult.data.id,
      name: normalizedEmail,
      path: "/app/team",
    },
    {
      role: normalizedRole,
      event: "invite_sent",
      delivery,
    },
  );

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "invitation",
    entityId: invitationResult.data.id,
    actionType: "USER_INVITED",
    afterState: { email: normalizedEmail, role: normalizedRole, delivery },
    reason: "invite",
  });

  revalidatePath("/app/team");
  return {
    success: true,
    delivery,
    inviteId: invitationResult.data.id,
    inviteUrl,
  };
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
    .maybeSingle();

  if (!membership || membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Access Denied");
  }

  // 2. Fetch Target Details (Before deletion, for Logging)
  const { data: targetMember } = await supabase
    .from("org_members")
    .select("role") 
    .eq("user_id", targetUserId)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

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

  await logProductActivity(
    membership.organization_id,
    user.id,
    "deleted",
    {
      type: "member",
      id: targetUserId,
      name: targetUserId,
      path: "/app/team",
    },
    {
      previousRole: targetMember.role,
    },
  );

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
