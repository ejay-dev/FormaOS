"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/app/app/actions/audit";
import { revalidatePath } from "next/cache";

/**
 * ✅ INVITE MEMBER (Direct Argument Version)
 * Optimized for Client Components using useForm()
 */
export async function inviteMember(email: string, role: string) {
  const supabase = await createSupabaseServerClient();

  // 1. Auth Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Verify Admin Privileges
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== 'admin') {
    throw new Error("Insufficient privileges: Only Admins can invite members.");
  }

  // 3. Send Invite (Supabase Auth)
  const { data: inviteData, error: inviteError } = await supabase
    .auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: membership.organization_id,
        role: role,
        invited_by: user.id
      }
    });

  if (inviteError) {
    console.error("Invite Failed:", inviteError);
    // Return structured error for UI to handle
    return { success: false, error: inviteError.message };
  }

  // 4. ✅ SECURITY LOGGING
  // This is a high-risk action, so we log it securely.
  await logActivity(membership.organization_id, "INVITE_USER", {
    resourceName: email,
    event: "Security access granted (Invitation)",
    assignedRole: role,
    inviteId: inviteData.user.id
  });

  revalidatePath("/app/team");
  return { success: true };
}

/**
 * ✅ REMOVE MEMBER (Keep this from before)
 */
export async function removeTeamMember(targetUserId: string) {
  // ... (Previous implementation remains valid)
  // If you need this code again, let me know.
  return { success: true };
}