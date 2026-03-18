"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function updateOrgName(orgId: string, newName: string) {
  const supabase = await createSupabaseServerClient();
  const permissionCtx = await requirePermission("MANAGE_USERS");

  // 1. Check Permissions (Security First)
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!membership || permissionCtx.orgId !== orgId) {
    throw new Error("Unauthorized: Only authorized users can update settings.");
  }

  // 2. Update the Organization
  const { error } = await supabase
    .from("organizations")
    .update({ name: newName })
    .eq("id", orgId);

  if (error) {
    throw new Error(error.message);
  }

  await logAuditEvent({
    organizationId: orgId,
    actorUserId: permissionCtx.userId,
    actorRole: permissionCtx.role,
    entityType: "organization",
    entityId: orgId,
    actionType: "ORG_NAME_UPDATED",
    afterState: { name: newName },
    reason: "org_update",
  });

  // 3. Refresh the page to show new data
  revalidatePath("/app/settings");
  revalidatePath("/app"); // Refresh dashboard too so top bar updates
}
