"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/app/app/actions/audit";
import { revalidatePath } from "next/cache";
import { notifySelf } from "@/app/app/actions/notifications";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { actionError, isNextInternalError } from "@/lib/actions/safe";
import {
  createInitialVersion,
  getLatestVersion,
  publishApprovedVersion,
  recordApprovalDecision,
  submitVersionForReview,
  upsertDraftVersion,
} from "@/lib/policies/lifecycle";

export async function createPolicy(formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

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

  // Lifecycle wiring (Phase 1): seed version 1 in policy_versions.
  // Failures are logged but non-fatal so the create flow doesn't break if
  // 20260403_policy_lifecycle.sql / 20260430_007_policy_lifecycle_repair.sql
  // hasn't been applied yet.
  try {
    await createInitialVersion(supabase, {
      orgId: membership.organization_id,
      policyId: policy.id,
      title,
      content: content ?? "",
      createdBy: user.id,
    });
  } catch (versionErr) {
    console.warn("[policies.createPolicy] initial version seed failed:", versionErr);
  }

  await logActivity(membership.organization_id, "CREATE_POLICY", {
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

  await logAuditEvent(
    {
      organizationId: membership.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "policy",
      entityId: policy.id,
      actionType: "POLICY_CREATED",
      afterState: { title, status: "draft", framework },
      reason: "create",
    },
    { required: true },
  );

  revalidatePath("/app/policies");
  return { success: true, policyId: policy.id };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updatePolicy(formData: FormData) {
  try {
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
    .maybeSingle();

  if (!oldPolicy) throw new Error("Policy not found");
  if (oldPolicy.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  // Lifecycle wiring (Phase 1): if a version is currently awaiting approval,
  // refuse the edit so authors can't silently bypass the approval flow by
  // editing the underlying org_policies row.
  try {
    const latestVersion = await getLatestVersion(supabase, policyId);
    if (latestVersion && latestVersion.status === "pending_approval") {
      throw new Error(
        "This policy has a version awaiting approval. Approve or reject the pending version before making further edits.",
      );
    }
  } catch (lifecycleErr) {
    // Re-throw the user-facing message; swallow other errors so a missing
    // lifecycle table doesn't block updates pre-migration.
    if (
      lifecycleErr instanceof Error &&
      lifecycleErr.message.includes("awaiting approval")
    ) {
      throw lifecycleErr;
    }
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

  // Lifecycle wiring (Phase 1): mirror the edit into policy_versions so the
  // approval workflow has a typed revision to operate on. Best-effort —
  // failures are logged, not thrown, so an unmigrated DB doesn't break edits.
  try {
    await upsertDraftVersion(supabase, {
      orgId: oldPolicy.organization_id,
      policyId,
      title,
      content: content ?? "",
      createdBy: user.id,
    });
  } catch (versionErr) {
    console.warn("[policies.updatePolicy] draft version upsert failed:", versionErr);
  }

  await logActivity(oldPolicy.organization_id, "UPDATE_POLICY", {
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

  await logAuditEvent(
    {
      organizationId: oldPolicy.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "policy",
      entityId: policyId,
      actionType: "POLICY_UPDATED",
      beforeState: { title: oldPolicy.title },
      afterState: { title, status },
      reason: "update",
    },
    { required: true },
  );

  revalidatePath("/app/policies");
  revalidatePath(`/app/policies/${policyId}`);
  revalidatePath(`/app/policies/${policyId}/edit`);
  revalidatePath(`/app/policies/${policyId}/versions`);
  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function linkArtifactToPolicy(policyId: string, evidenceId: string) {
  try {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: policy } = await supabase
    .from("org_policies")
    .select("organization_id, title")
    .eq("id", policyId)
    .eq("organization_id", permissionCtx.orgId)
    .maybeSingle();

  if (!policy) throw new Error("Policy not found");

  const { error } = await supabase
    .from("org_evidence")
    .update({ policy_id: policyId })
    .eq("id", evidenceId)
    .eq("organization_id", policy.organization_id);

  if (error) throw new Error(`Linking Failed: ${error.message}`);

  await logActivity(policy.organization_id, "UPDATE_POLICY", {
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

  await logAuditEvent(
    {
      organizationId: policy.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "policy",
      entityId: policyId,
      actionType: "POLICY_EVIDENCE_LINKED",
      afterState: { evidenceId },
      reason: "link_evidence",
    },
    { required: true },
  );

  revalidatePath(`/app/policies/${policyId}`);
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

// ============================================================
// LIFECYCLE ACTIONS (Phase 1)
//
// Wire submit / approve / reject / publish onto the existing
// policy_versions + policy_approvals tables. UI surfaces these via the
// detail page at /app/policies/[id].
// ============================================================

const APPROVAL_ROLES = new Set(["owner", "admin"]);
const REVIEW_FREQUENCIES = new Set([
  "quarterly",
  "semi_annual",
  "annual",
  "biennial",
]);

async function getLifecycleContext(policyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) throw new Error("Organization context lost");

  const { data: policy } = await supabase
    .from("org_policies")
    .select("organization_id, title, status")
    .eq("id", policyId)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  if (!policy) throw new Error("Policy not found");

  return { supabase, user, membership, policy };
}

/**
 * Submit the latest draft for review. Author submits; an admin/owner approves.
 * Phase 1 keeps reviewer assignment implicit — approvers are anyone in the
 * org with role owner/admin who hits the Approve button.
 */
export async function submitPolicyForReview(formData: FormData) {
  try {
    const policyId = formData.get("policyId") as string;
    if (!policyId) throw new Error("policyId required");

    const { supabase, user, membership, policy } =
      await getLifecycleContext(policyId);

    const latest = await getLatestVersion(supabase, policyId);
    if (!latest) {
      throw new Error(
        "This policy has no version history yet. Save an edit first.",
      );
    }
    if (latest.status !== "draft") {
      throw new Error(
        `Cannot submit: latest version is in status="${latest.status}".`,
      );
    }

    await submitVersionForReview(supabase, {
      versionId: latest.id,
      approverIds: [], // Phase 1: no pre-assigned reviewers; any owner/admin can decide.
    });

    // Mirror status onto org_policies for back-compat with the existing list/detail UI.
    await supabase
      .from("org_policies")
      .update({
        status: "review",
        last_updated_at: new Date().toISOString(),
        last_updated_by: user.id,
      })
      .eq("id", policyId)
      .eq("organization_id", membership.organization_id);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: (membership.role as string | null) ?? null,
        entityType: "policy",
        entityId: policyId,
        actionType: "POLICY_SUBMITTED_FOR_REVIEW",
        afterState: {
          version_id: latest.id,
          version_number: latest.version_number,
          title: policy.title,
        },
        reason: "submit_for_review",
      },
      { required: true },
    );

    revalidatePath(`/app/policies/${policyId}`);
    revalidatePath(`/app/policies/${policyId}/versions`);
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Approve the pending version. Owner/admin only. Phase 1 single-approver
 * semantics: one approval flips status to `approved`, then the same action
 * publishes it (atomic-from-the-user's-POV) and marks org_policies.status
 * = 'published'.
 */
export async function approvePolicy(formData: FormData) {
  try {
    const policyId = formData.get("policyId") as string;
    const comment = (formData.get("comment") as string | null) ?? null;
    if (!policyId) throw new Error("policyId required");

    const { supabase, user, membership, policy } =
      await getLifecycleContext(policyId);

    const role = (membership.role as string | null) ?? "";
    if (!APPROVAL_ROLES.has(role)) {
      throw new Error("Only owner or admin can approve policies.");
    }

    const latest = await getLatestVersion(supabase, policyId);
    if (!latest) throw new Error("No policy version to approve.");
    if (latest.status !== "pending_approval") {
      throw new Error(
        `Cannot approve: latest version is in status="${latest.status}".`,
      );
    }

    // Block self-approval — author cannot approve their own version.
    if (latest.created_by === user.id) {
      throw new Error(
        "You cannot approve a policy version you authored. A different owner or admin must review.",
      );
    }

    // Record decision (flips version → approved).
    await recordApprovalDecision(supabase, {
      versionId: latest.id,
      approverId: user.id,
      decision: "approved",
      comment,
    });

    // Publish immediately in Phase 1 (no separate publish step in the UI yet).
    await publishApprovedVersion(supabase, latest.id);

    // Mirror onto org_policies for the existing UI.
    await supabase
      .from("org_policies")
      .update({
        status: "published",
        last_updated_at: new Date().toISOString(),
        last_updated_by: user.id,
      })
      .eq("id", policyId)
      .eq("organization_id", membership.organization_id);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: role,
        entityType: "policy",
        entityId: policyId,
        actionType: "POLICY_APPROVED_AND_PUBLISHED",
        afterState: {
          version_id: latest.id,
          version_number: latest.version_number,
          title: policy.title,
          comment,
        },
        reason: "approve",
      },
      { required: true },
    );

    await notifySelf({
      organizationId: membership.organization_id,
      type: "POLICY_APPROVED",
      title: "Policy Published",
      body: policy.title,
      actionUrl: `/app/policies/${policyId}`,
      metadata: {
        policyId,
        versionNumber: latest.version_number,
      },
    });

    revalidatePath(`/app/policies/${policyId}`);
    revalidatePath(`/app/policies/${policyId}/versions`);
    revalidatePath("/app/policies");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Reject the pending version. Owner/admin only. Returns the version to
 * draft so the author can revise.
 */
export async function rejectPolicy(formData: FormData) {
  try {
    const policyId = formData.get("policyId") as string;
    const comment = (formData.get("comment") as string | null) ?? null;
    if (!policyId) throw new Error("policyId required");

    const { supabase, user, membership, policy } =
      await getLifecycleContext(policyId);

    const role = (membership.role as string | null) ?? "";
    if (!APPROVAL_ROLES.has(role)) {
      throw new Error("Only owner or admin can reject policies.");
    }

    const latest = await getLatestVersion(supabase, policyId);
    if (!latest) throw new Error("No policy version to reject.");
    if (latest.status !== "pending_approval") {
      throw new Error(
        `Cannot reject: latest version is in status="${latest.status}".`,
      );
    }

    if (latest.created_by === user.id) {
      throw new Error(
        "You cannot reject a policy version you authored.",
      );
    }

    await recordApprovalDecision(supabase, {
      versionId: latest.id,
      approverId: user.id,
      decision: "rejected",
      comment,
    });

    await supabase
      .from("org_policies")
      .update({
        status: "draft",
        last_updated_at: new Date().toISOString(),
        last_updated_by: user.id,
      })
      .eq("id", policyId)
      .eq("organization_id", membership.organization_id);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: role,
        entityType: "policy",
        entityId: policyId,
        actionType: "POLICY_REJECTED",
        afterState: {
          version_id: latest.id,
          version_number: latest.version_number,
          title: policy.title,
          comment,
        },
        reason: "reject",
      },
      { required: true },
    );

    revalidatePath(`/app/policies/${policyId}`);
    revalidatePath(`/app/policies/${policyId}/versions`);
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function acknowledgePolicyVersion(formData: FormData) {
  try {
    const policyId = formData.get("policyId") as string;
    if (!policyId) throw new Error("policyId required");

    const { supabase, user, membership, policy } =
      await getLifecycleContext(policyId);

    const latest = await getLatestVersion(supabase, policyId);
    if (!latest || latest.status !== "published") {
      throw new Error("Only the current published policy version can be acknowledged.");
    }

    const { error } = await supabase.from("policy_acknowledgments").upsert(
      {
        org_id: membership.organization_id,
        policy_id: policyId,
        policy_version_id: latest.id,
        user_id: user.id,
        acknowledged_at: new Date().toISOString(),
      },
      { onConflict: "policy_version_id,user_id" },
    );

    if (error) throw new Error(`Policy acknowledgment failed: ${error.message}`);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: (membership.role as string | null) ?? null,
        entityType: "policy",
        entityId: policyId,
        actionType: "POLICY_ACKNOWLEDGED",
        afterState: {
          title: policy.title,
          version_id: latest.id,
          version_number: latest.version_number,
        },
        reason: "acknowledge",
      },
      { required: true },
    );

    await logActivity(membership.organization_id, "UPDATE_POLICY", {
      resourceName: policy.title,
      event: "Policy acknowledged",
      policyId,
      versionId: latest.id,
    });

    revalidatePath(`/app/policies/${policyId}`);
    revalidatePath(`/app/policies/${policyId}/versions`);
    revalidatePath("/app/policies/versions");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function schedulePolicyReview(formData: FormData) {
  try {
    const policyId = formData.get("policyId") as string;
    const frequency = String(formData.get("frequency") ?? "annual");
    const nextReviewDate = String(formData.get("nextReviewDate") ?? "");
    if (!policyId) throw new Error("policyId required");
    if (!REVIEW_FREQUENCIES.has(frequency)) {
      throw new Error("Invalid review frequency.");
    }
    if (!nextReviewDate || Number.isNaN(Date.parse(nextReviewDate))) {
      throw new Error("A valid next review date is required.");
    }

    const { supabase, user, membership, policy } =
      await getLifecycleContext(policyId);
    const role = (membership.role as string | null) ?? "";
    if (!APPROVAL_ROLES.has(role)) {
      throw new Error("Only owner or admin can schedule policy reviews.");
    }

    const reviewerIds = formData
      .getAll("reviewerIds")
      .map((value) => String(value))
      .filter(Boolean);

    const schedulePayload = {
      org_id: membership.organization_id,
      policy_id: policyId,
      review_frequency: frequency,
      next_review_date: nextReviewDate,
      reviewer_ids: reviewerIds,
      last_reviewed_at: null,
    };

    const { data: existing, error: existingError } = await supabase
      .from("policy_review_schedules")
      .select("id")
      .eq("org_id", membership.organization_id)
      .eq("policy_id", policyId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Review schedule lookup failed: ${existingError.message}`);
    }

    const scheduleId = existing && "id" in existing ? String(existing.id) : null;
    const scheduleWrite = scheduleId
      ? supabase
          .from("policy_review_schedules")
          .update(schedulePayload)
          .eq("id", scheduleId)
          .eq("org_id", membership.organization_id)
      : supabase.from("policy_review_schedules").insert(schedulePayload);

    const { error } = await scheduleWrite;
    if (error) throw new Error(`Review schedule failed: ${error.message}`);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: role,
        entityType: "policy",
        entityId: policyId,
        actionType: "POLICY_REVIEW_SCHEDULED",
        afterState: {
          title: policy.title,
          review_frequency: frequency,
          next_review_date: nextReviewDate,
          reviewer_count: reviewerIds.length,
        },
        reason: "schedule_review",
      },
      { required: true },
    );

    revalidatePath(`/app/policies/${policyId}`);
    revalidatePath(`/app/policies/${policyId}/versions`);
    revalidatePath("/app/policies/versions");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
