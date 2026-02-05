"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logger";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function updateOrganization(data: {
  name: string;
  domain?: string;
  registrationNumber?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("MANAGE_USERS");

  // 1. Get current Admin's Org
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Security Violation: Only authorized users can modify organization settings.");
  }

  const admin = createSupabaseAdminClient();

  // 2. Update Organization Metadata (admin client bypasses strict org RLS)
  const { error } = await admin
    .from("organizations")
    .update({
      name: data.name,
      domain: data.domain,
      registration_number: data.registrationNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.organization_id);

  if (error) throw error;

  // 3. Log System Event
  await logActivity(
    membership.organization_id, 
    "updated_policy", // Using as proxy for 'Governance Update'
    `Admin updated organization profile and domain settings.`
  );

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "organization",
    entityId: membership.organization_id,
    actionType: "ORG_UPDATED",
    afterState: { name: data.name, domain: data.domain, registrationNumber: data.registrationNumber },
    reason: "org_update",
  });

  revalidatePath("/app/settings");
  return { success: true };
}
