"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/app/app/actions/audit";
import { revalidatePath } from "next/cache";
import { notifySelf } from "@/app/app/actions/notifications";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function createPolicy(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Organization context lost");
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const content = formData.get("content") as string;
  const framework = (formData.get("framework") as string) || "General";

  const { data: policy, error } = await supabase
    .from("org_policies")
    .insert({
      organization_id: membership.organization_id,
      title,
      description,
      content,
      framework_tag: framework,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Policy Creation Failed: ${error.message}`);

  await logActivity(membership.organization_id, "CREATE_POLICY" as any, {
    resourceName: title,
    event: "Governance policy initialized",
    framework,
    status: "draft",
    policyId: policy.id,
  });

  // 🔔 Self notification (preference-aware)
  await notifySelf({
    organizationId: membership.organization_id,
    type: "POLICY_CREATED",
    title: "New Policy Created",
    body: title,
    actionUrl: `/app/policies/${policy.id}`,
    metadata: {
      policyId: policy.id,
      framework,
      status: "draft",
    },
  });

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "policy",
    entityId: policy.id,
    actionType: "POLICY_CREATED",
    afterState: { title, status: "draft", framework },
    reason: "create",
  });

  revalidatePath("/app/policies");
  return { success: true, policyId: policy.id };
}

export async function updatePolicy(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const policyId = formData.get("policyId") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const status = formData.get("status") as string;

  const { data: oldPolicy } = await supabase
    .from("org_policies")
    .select("organization_id, title")
    .eq("id", policyId)
    .eq("organization_id", permissionCtx.orgId)
    .single();

  if (!oldPolicy) throw new Error("Policy not found");
  if (oldPolicy.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  const { error } = await supabase
    .from("org_policies")
    .update({
      title,
      content,
      status,
      last_updated_at: new Date().toISOString(),
      last_updated_by: user.id,
    })
    .eq("id", policyId)
    .eq("organization_id", oldPolicy.organization_id);

  if (error) throw error;

  await logActivity(oldPolicy.organization_id, "UPDATE_POLICY" as any, {
    resourceName: title,
    event: "Policy modification",
    previousTitle: oldPolicy.title !== title ? oldPolicy.title : undefined,
    policyId,
  });

  await notifySelf({
    organizationId: oldPolicy.organization_id,
    type: "POLICY_UPDATED",
    title: "Policy Updated",
    body: title,
    actionUrl: `/app/policies/${policyId}`,
    metadata: {
      policyId,
      status,
      previousTitle: oldPolicy.title !== title ? oldPolicy.title : null,
    },
  });

  await logAuditEvent({
    organizationId: oldPolicy.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "policy",
    entityId: policyId,
    actionType: "POLICY_UPDATED",
    beforeState: { title: oldPolicy.title },
    afterState: { title, status },
    reason: "update",
  });

  revalidatePath("/app/policies");
  return { success: true };
}

export async function linkArtifactToPolicy(policyId: string, evidenceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: policy } = await supabase
    .from("org_policies")
    .select("organization_id, title")
    .eq("id", policyId)
    .eq("organization_id", permissionCtx.orgId)
    .single();

  if (!policy) throw new Error("Policy not found");

  const { error } = await supabase
    .from("org_evidence")
    .update({ policy_id: policyId })
    .eq("id", evidenceId)
    .eq("organization_id", policy.organization_id);

  if (error) throw new Error(`Linking Failed: ${error.message}`);

  await logActivity(policy.organization_id, "UPDATE_POLICY" as any, {
    resourceName: policy.title,
    event: "Evidence linked to policy",
    evidenceId,
  });

  await notifySelf({
    organizationId: policy.organization_id,
    type: "EVIDENCE_LINKED",
    title: "Evidence Linked to Policy",
    body: policy.title,
    actionUrl: `/app/policies/${policyId}`,
    metadata: { policyId, evidenceId },
  });

  await logAuditEvent({
    organizationId: policy.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "policy",
    entityId: policyId,
    actionType: "POLICY_EVIDENCE_LINKED",
    afterState: { evidenceId },
    reason: "link_evidence",
  });

  revalidatePath(`/app/policies/${policyId}`);
}
