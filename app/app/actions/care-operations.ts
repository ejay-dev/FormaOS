"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { insertOrgTaskCompat } from "@/lib/tasks/persistence";
import { actionError, isNextInternalError } from "@/lib/actions/safe";

async function requireUserOrganization(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership?.organization_id) {
    throw new Error("No organization found");
  }

  return membership.organization_id as string;
}

// =========================================================
// PARTICIPANT / CLIENT ACTIONS
// =========================================================

export async function createParticipant(formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  // Get user's organization
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("No organization found");

  const participant = {
    organization_id: membership.organization_id,
    full_name: formData.get("full_name") as string,
    preferred_name: formData.get("preferred_name") as string || null,
    external_id: formData.get("external_id") as string || null,
    date_of_birth: formData.get("date_of_birth") as string || null,
    gender: formData.get("gender") as string || null,
    phone: formData.get("phone") as string || null,
    email: formData.get("email") as string || null,
    address: formData.get("address") as string || null,
    emergency_contact_name: formData.get("emergency_contact_name") as string || null,
    emergency_contact_phone: formData.get("emergency_contact_phone") as string || null,
    emergency_contact_relationship: formData.get("emergency_contact_relationship") as string || null,
    care_status: formData.get("care_status") as string || "active",
    risk_level: formData.get("risk_level") as string || "low",
    emergency_flag: formData.get("emergency_flag") === "true",
    ndis_number: formData.get("ndis_number") as string || null,
    funding_type: formData.get("funding_type") as string || null,
    plan_start_date: formData.get("plan_start_date") as string || null,
    plan_end_date: formData.get("plan_end_date") as string || null,
    primary_diagnosis: formData.get("primary_diagnosis") as string || null,
    communication_needs: formData.get("communication_needs") as string || null,
    cultural_considerations: formData.get("cultural_considerations") as string || null,
    created_by: user.id,
  };

  const { error } = await supabase
    .from("org_patients")
    .insert(participant)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/app/participants");
  redirect("/app/participants");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updateParticipant(id: string, formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");
  const organizationId = await requireUserOrganization(supabase, user.id);

  const updates = {
    full_name: formData.get("full_name") as string,
    preferred_name: formData.get("preferred_name") as string || null,
    external_id: formData.get("external_id") as string || null,
    date_of_birth: formData.get("date_of_birth") as string || null,
    gender: formData.get("gender") as string || null,
    phone: formData.get("phone") as string || null,
    email: formData.get("email") as string || null,
    address: formData.get("address") as string || null,
    emergency_contact_name: formData.get("emergency_contact_name") as string || null,
    emergency_contact_phone: formData.get("emergency_contact_phone") as string || null,
    emergency_contact_relationship: formData.get("emergency_contact_relationship") as string || null,
    care_status: formData.get("care_status") as string,
    risk_level: formData.get("risk_level") as string,
    emergency_flag: formData.get("emergency_flag") === "true",
    ndis_number: formData.get("ndis_number") as string || null,
    funding_type: formData.get("funding_type") as string || null,
    primary_diagnosis: formData.get("primary_diagnosis") as string || null,
    communication_needs: formData.get("communication_needs") as string || null,
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("org_patients")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/participants/${id}`);
  revalidatePath("/app/participants");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

// =========================================================
// VISIT ACTIONS
// =========================================================

export async function createVisit(formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("No organization found");

  const visit = {
    organization_id: membership.organization_id,
    client_id: formData.get("client_id") as string || null,
    staff_id: formData.get("staff_id") as string || user.id,
    visit_type: formData.get("visit_type") as string || "service",
    service_category: formData.get("service_category") as string || null,
    scheduled_start: formData.get("scheduled_start") as string,
    scheduled_end: formData.get("scheduled_end") as string || null,
    status: "scheduled",
    location_type: formData.get("location_type") as string || null,
    address: formData.get("address") as string || null,
    notes: formData.get("notes") as string || null,
    billable: formData.get("billable") !== "false",
    funding_source: formData.get("funding_source") as string || null,
    created_by: user.id,
  };

  const { error } = await supabase
    .from("org_visits")
    .insert(visit)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/app/visits");
  redirect("/app/visits");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updateVisitStatus(id: string, status: string, notes?: string) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");
  const organizationId = await requireUserOrganization(supabase, user.id);

  const updates: Record<string, any> = { status };

  if (status === "in_progress") {
    updates.actual_start = new Date().toISOString();
  } else if (status === "completed") {
    updates.actual_end = new Date().toISOString();
    if (notes) updates.outcomes = notes;
  } else if (status === "cancelled" || status === "missed") {
    if (notes) updates.cancellation_reason = notes;
  }

  const { error } = await supabase
    .from("org_visits")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  revalidatePath("/app/visits");
  revalidatePath(`/app/visits/${id}`);
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

// =========================================================
// INCIDENT ACTIONS
// =========================================================

export async function createIncident(formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("No organization found");

  const incident = {
    organization_id: membership.organization_id,
    patient_id: formData.get("patient_id") as string || null,
    reported_by: user.id,
    incident_type: formData.get("incident_type") as string || "general",
    severity: formData.get("severity") as string || "low",
    status: "open",
    description: formData.get("description") as string,
    occurred_at: formData.get("occurred_at") as string || new Date().toISOString(),
    location: formData.get("location") as string || null,
    immediate_actions: formData.get("immediate_actions") as string || null,
    follow_up_required: formData.get("follow_up_required") === "true",
    follow_up_due_date: formData.get("follow_up_due_date") as string || null,
  };

  const { error } = await supabase
    .from("org_incidents")
    .insert(incident)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Create follow-up task if required
  if (incident.follow_up_required) {
    await insertOrgTaskCompat(supabase, {
      organization_id: membership.organization_id,
      title: `Follow-up: Incident - ${incident.incident_type}`,
      description: `Follow up on incident: ${incident.description?.substring(0, 100)}...`,
      priority:
        incident.severity === "critical"
          ? "critical"
          : incident.severity === "high"
            ? "high"
            : "medium",
      due_date: incident.follow_up_due_date,
      status: "pending",
      created_by: user.id,
      patient_id: incident.patient_id,
    });
  }

  revalidatePath("/app/incidents");
  redirect("/app/incidents");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function resolveIncident(id: string, formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");
  const organizationId = await requireUserOrganization(supabase, user.id);

  const { error } = await supabase
    .from("org_incidents")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      root_cause: formData.get("root_cause") as string || null,
      preventive_measures: formData.get("preventive_measures") as string || null,
      follow_up_completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  revalidatePath("/app/incidents");
  revalidatePath(`/app/incidents/${id}`);
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

// =========================================================
// STAFF CREDENTIAL ACTIONS
// =========================================================

export async function createStaffCredential(formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("No organization found");

  const credential = {
    organization_id: membership.organization_id,
    user_id: formData.get("user_id") as string || user.id,
    credential_type: formData.get("credential_type") as string,
    credential_name: formData.get("credential_name") as string,
    credential_number: formData.get("credential_number") as string || null,
    issuing_authority: formData.get("issuing_authority") as string || null,
    issue_date: formData.get("issue_date") as string || null,
    expiry_date: formData.get("expiry_date") as string || null,
    status: "pending",
    notes: formData.get("notes") as string || null,
    created_by: user.id,
  };

  const { error } = await supabase
    .from("org_staff_credentials")
    .insert(credential)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Create reminder task if expiry date is set
  if (credential.expiry_date) {
    const expiryDate = new Date(credential.expiry_date);
    const reminderDate = new Date(expiryDate);
    reminderDate.setDate(reminderDate.getDate() - 30); // 30 days before expiry

    await insertOrgTaskCompat(supabase, {
      organization_id: membership.organization_id,
      title: `Credential Expiring: ${credential.credential_name}`,
      description: `${credential.credential_type} credential expires on ${expiryDate.toLocaleDateString()}`,
      priority: "high",
      due_date: reminderDate.toISOString(),
      status: "pending",
      created_by: user.id,
    });
  }

  revalidatePath("/app/staff-compliance");
  redirect("/app/staff-compliance");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function verifyStaffCredential(id: string) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");
  const organizationId = await requireUserOrganization(supabase, user.id);

  const { error } = await supabase
    .from("org_staff_credentials")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  revalidatePath("/app/staff-compliance");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

// =========================================================
// CARE PLAN ACTIONS
// =========================================================

export async function createCarePlan(formData: FormData) {
  try {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("No organization found");

  const carePlan = {
    organization_id: membership.organization_id,
    client_id: formData.get("client_id") as string,
    plan_type: formData.get("plan_type") as string || "support",
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string || null,
    review_date: formData.get("review_date") as string || null,
    status: "draft",
    goals: JSON.parse(formData.get("goals") as string || "[]"),
    supports: JSON.parse(formData.get("supports") as string || "[]"),
    created_by: user.id,
  };

  const { error } = await supabase
    .from("org_care_plans")
    .insert(carePlan)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/app/care-plans");
  redirect("/app/care-plans");
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

const CARE_PLAN_STATUSES = [
  'draft',
  'active',
  'under_review',
  'expired',
  'archived',
] as const;
type CarePlanStatus = (typeof CARE_PLAN_STATUSES)[number];

export async function updateCarePlanStatus(
  planId: string,
  nextStatus: string,
) {
  try {
    if (!CARE_PLAN_STATUSES.includes(nextStatus as CarePlanStatus)) {
      return actionError(new Error(`Invalid status: ${nextStatus}`));
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionError(new Error('Not authenticated'));

    const orgId = await requireUserOrganization(supabase, user.id);

    const { data: existing, error: readErr } = await supabase
      .from('org_care_plans')
      .select('id, status, title, organization_id')
      .eq('id', planId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (readErr) return actionError(readErr);
    if (!existing) return actionError(new Error('Care plan not found'));
    if (existing.status === nextStatus) return { success: true as const };

    const { error: updateErr } = await supabase
      .from('org_care_plans')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('organization_id', orgId);

    if (updateErr) return actionError(updateErr);

    revalidatePath('/app/care-plans');
    revalidatePath('/app/care-plans/journey');
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
