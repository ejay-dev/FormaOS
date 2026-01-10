"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logger"; // ✅ 1. Import the Logger
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function createPolicy(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  // 2. Get Org
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("No organization found");
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  // 3. Create Policy
  const title = formData.get("title") as string;
  
  const { error } = await supabase.from("org_policies").insert({
    organization_id: membership.organization_id,
    title: title,
    content: "## Policy Overview\n\nWrite your policy content here...",
    status: "draft",
    author: user.email, // Simple author tracking
    version: "v0.1"
  });

  if (error) throw new Error(error.message);

  // ✅ 4. LOG ACTIVITY
  await logActivity(membership.organization_id, "created_policy", title);

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "policy",
    entityId: null,
    actionType: "POLICY_CREATED",
    afterState: { title, status: "draft", version: "v0.1" },
    reason: "policy_create",
  });

  revalidatePath("/app/policies");
}

export async function deletePolicy(policyId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const permissionCtx = await requirePermission("EDIT_CONTROLS");
    
    // Fetch policy details first so we know what we are deleting (for the log)
    const { data: policy } = await supabase
      .from("org_policies")
      .select("id, title, organization_id, status")
      .eq("id", policyId)
      .eq("organization_id", permissionCtx.orgId)
      .single();
    if (!policy) throw new Error("Policy not found");
    if (policy.organization_id !== permissionCtx.orgId) {
      throw new Error("Organization mismatch.");
    }

    const { error } = await supabase
      .from("org_policies")
      .delete()
      .eq("id", policyId)
      .eq("organization_id", policy.organization_id);
    
    if (error) throw new Error(error.message);

    // ✅ LOG ACTIVITY
    if (policy) {
        await logActivity(policy.organization_id, "deleted_policy", policy.title);
    }

    await logAuditEvent({
      organizationId: policy.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "policy",
      entityId: policy.id,
      actionType: "POLICY_DELETED",
      beforeState: { title: policy.title, status: policy.status },
      reason: "policy_delete",
    });

    revalidatePath("/app/policies");
}

export async function updatePolicyContent(policyId: string, content: string) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: policy } = await supabase
    .from("org_policies")
    .select("id, organization_id")
    .eq("id", policyId)
    .eq("organization_id", permissionCtx.orgId)
    .single();
  if (!policy) throw new Error("Policy not found");
  if (policy.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  // 2. Update Content
  const { error } = await supabase
    .from("org_policies")
    .update({ 
        content: content,
        updated_at: new Date().toISOString(),
        author: user.email // Track who last edited it
    })
    .eq("id", policyId)
    .eq("organization_id", policy.organization_id);

  if (error) throw new Error(error.message);

  await logAuditEvent({
    organizationId: policy.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "policy",
    entityId: policyId,
    actionType: "POLICY_CONTENT_UPDATED",
    afterState: { updated_at: new Date().toISOString() },
    reason: "policy_update",
  });

  revalidatePath(`/app/policies/${policyId}`);
}

export async function publishPolicy(policyId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const permissionCtx = await requirePermission("EDIT_CONTROLS");
    
    // Fetch policy details first for the log
    const { data: policy } = await supabase
      .from("org_policies")
      .select("id, title, organization_id, status")
      .eq("id", policyId)
      .eq("organization_id", permissionCtx.orgId)
      .single();
    if (!policy) throw new Error("Policy not found");
    if (policy.organization_id !== permissionCtx.orgId) {
      throw new Error("Organization mismatch.");
    }

    // Simple version bump logic (v0.1 -> v1.0)
    const { error } = await supabase
      .from("org_policies")
      .update({ 
          status: 'published',
          version: 'v1.0',
          updated_at: new Date().toISOString()
      })
      .eq("id", policyId)
      .eq("organization_id", policy.organization_id);
  
    if (error) throw new Error(error.message);

    // ✅ LOG ACTIVITY
    if (policy) {
        await logActivity(policy.organization_id, "published_policy", policy.title);
    }

    await logAuditEvent({
      organizationId: policy.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "policy",
      entityId: policy.id,
      actionType: "POLICY_PUBLISHED",
      beforeState: { status: policy.status },
      afterState: { status: "published", version: "v1.0" },
      reason: "policy_publish",
    });

    revalidatePath("/app/policies");
}
