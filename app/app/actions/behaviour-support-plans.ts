"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, isNextInternalError } from "@/lib/actions/safe";
import { logAuditEvent } from "@/app/app/actions/audit-events";

/**
 * Behaviour Support Plan server actions. The table
 * (public.org_behaviour_support_plans) tracks the lifecycle required by
 * the NDIS Restrictive Practices and Behaviour Support Rules 2018
 * (F2018L00632) and drives the NDIS-V.2 + NDIS-M.2 predicates in
 * lib/compliance/evaluators/ndis/_predicates.ts.
 *
 * RLS (migration 20260624067) lets any org member SELECT/INSERT;
 * UPDATE/DELETE is restricted to owner/admin/compliance_admin.
 */

const PLAN_TYPES = new Set(["interim", "comprehensive"]);
const PLAN_STATUSES = new Set([
  "draft",
  "submitted",
  "authorised",
  "active",
  "expired",
  "withdrawn",
]);

function normaliseTimestamp(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // HTML <input type="date"> emits YYYY-MM-DD; let Postgres coerce to
  // timestamptz at midnight UTC. <input type="datetime-local"> emits
  // YYYY-MM-DDTHH:MM with no zone — same coercion applies.
  return trimmed;
}

function normaliseText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function getMembership() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.organization_id) throw new Error("No organization found");

  return { supabase, user, membership };
}

export async function createBehaviourSupportPlan(formData: FormData) {
  try {
    const { supabase, user, membership } = await getMembership();

    const planType = String(formData.get("plan_type") ?? "");
    if (!PLAN_TYPES.has(planType)) {
      throw new Error("plan_type must be 'interim' or 'comprehensive'");
    }

    const participantId = normaliseText(formData.get("participant_id"));

    const insertPayload = {
      organization_id: membership.organization_id,
      participant_id: participantId,
      plan_type: planType,
      status: "draft",
      first_restrictive_practice_at: normaliseTimestamp(
        formData.get("first_restrictive_practice_at"),
      ),
      authorised_at: normaliseTimestamp(formData.get("authorised_at")),
      effective_from: normaliseTimestamp(formData.get("effective_from")),
      expires_at: normaliseTimestamp(formData.get("expires_at")),
      reviewed_at: normaliseTimestamp(formData.get("reviewed_at")),
      authorising_body: normaliseText(formData.get("authorising_body")),
      authorisation_reference: normaliseText(
        formData.get("authorisation_reference"),
      ),
      sbs_provider_name: normaliseText(formData.get("sbs_provider_name")),
      sbs_provider_registration_id: normaliseText(
        formData.get("sbs_provider_registration_id"),
      ),
      notes: normaliseText(formData.get("notes")),
      created_by: user.id,
    };

    const { data: inserted, error } = await supabase
      .from("org_behaviour_support_plans")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: (membership.role as string | null) ?? null,
        entityType: "behaviour_support_plan",
        entityId: inserted?.id ?? null,
        actionType: "BSP_CREATED",
        afterState: {
          plan_type: planType,
          participant_id: participantId,
          first_restrictive_practice_at:
            insertPayload.first_restrictive_practice_at,
        },
        reason: "create_bsp",
      },
      { required: true },
    );

    revalidatePath("/app/behaviour-support-plans");
    redirect(`/app/behaviour-support-plans/${inserted?.id}`);
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updateBehaviourSupportPlan(formData: FormData) {
  try {
    const { supabase, user, membership } = await getMembership();

    const planId = String(formData.get("plan_id") ?? "");
    if (!planId) throw new Error("plan_id required");

    const planType = String(formData.get("plan_type") ?? "");
    if (!PLAN_TYPES.has(planType)) {
      throw new Error("plan_type must be 'interim' or 'comprehensive'");
    }
    const status = String(formData.get("status") ?? "draft");
    if (!PLAN_STATUSES.has(status)) {
      throw new Error("status must be draft|submitted|authorised|active|expired|withdrawn");
    }

    const participantId = normaliseText(formData.get("participant_id"));

    // Owner/admin/compliance_admin gate is enforced server-side via RLS
    // (migration 20260624067 lines 150-168). We surface a friendlier error
    // when RLS returns "no rows updated".
    const updatePayload = {
      participant_id: participantId,
      plan_type: planType,
      status,
      first_restrictive_practice_at: normaliseTimestamp(
        formData.get("first_restrictive_practice_at"),
      ),
      authorised_at: normaliseTimestamp(formData.get("authorised_at")),
      effective_from: normaliseTimestamp(formData.get("effective_from")),
      expires_at: normaliseTimestamp(formData.get("expires_at")),
      reviewed_at: normaliseTimestamp(formData.get("reviewed_at")),
      authorising_body: normaliseText(formData.get("authorising_body")),
      authorisation_reference: normaliseText(
        formData.get("authorisation_reference"),
      ),
      sbs_provider_name: normaliseText(formData.get("sbs_provider_name")),
      sbs_provider_registration_id: normaliseText(
        formData.get("sbs_provider_registration_id"),
      ),
      notes: normaliseText(formData.get("notes")),
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from("org_behaviour_support_plans")
      .update(updatePayload)
      .eq("id", planId)
      .eq("organization_id", membership.organization_id)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (!updated) {
      throw new Error(
        "Plan not updated. Only owner, admin, or compliance_admin can edit a behaviour support plan.",
      );
    }

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: (membership.role as string | null) ?? null,
        entityType: "behaviour_support_plan",
        entityId: planId,
        actionType: "BSP_UPDATED",
        afterState: { plan_type: planType, status },
        reason: "update_bsp",
      },
      { required: true },
    );

    revalidatePath("/app/behaviour-support-plans");
    revalidatePath(`/app/behaviour-support-plans/${planId}`);
    redirect(`/app/behaviour-support-plans/${planId}`);
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function deleteBehaviourSupportPlan(formData: FormData) {
  try {
    const { supabase, user, membership } = await getMembership();
    const planId = String(formData.get("plan_id") ?? "");
    if (!planId) throw new Error("plan_id required");

    const { error } = await supabase
      .from("org_behaviour_support_plans")
      .delete()
      .eq("id", planId)
      .eq("organization_id", membership.organization_id);
    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: (membership.role as string | null) ?? null,
        entityType: "behaviour_support_plan",
        entityId: planId,
        actionType: "BSP_DELETED",
        reason: "delete_bsp",
      },
      { required: true },
    );

    revalidatePath("/app/behaviour-support-plans");
    redirect("/app/behaviour-support-plans");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
