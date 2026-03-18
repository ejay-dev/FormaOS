"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgMembership, RoleKey } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

const STAFF_WRITE_ROLES = new Set<RoleKey>(["OWNER", "COMPLIANCE_OFFICER", "MANAGER", "STAFF"]);
const ADMIN_ROLES = new Set<RoleKey>(["OWNER", "COMPLIANCE_OFFICER", "MANAGER"]);

async function requireRole(allowed: Set<RoleKey>) {
  const membership = await getUserOrgMembership();
  if (!allowed.has(membership.role)) {
    throw new Error("Access denied");
  }
  return membership;
}

export async function createPatient(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(STAFF_WRITE_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const fullName = (formData.get("fullName") as string) || "";
  const externalId = (formData.get("externalId") as string) || null;
  const dateOfBirth = (formData.get("dateOfBirth") as string) || null;
  const careStatus = (formData.get("careStatus") as string) || "active";
  const riskLevel = (formData.get("riskLevel") as string) || "low";
  const emergencyFlag = formData.get("emergencyFlag") === "on";

  if (!fullName.trim()) throw new Error("Patient name is required");

  const { data: patient, error } = await supabase
    .from("org_patients")
    .insert({
      organization_id: membership.orgId,
      full_name: fullName.trim(),
      external_id: externalId,
      date_of_birth: dateOfBirth || null,
      care_status: careStatus,
      risk_level: riskLevel,
      emergency_flag: emergencyFlag,
      created_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "patient",
    entityId: patient?.id ?? null,
    actionType: "PATIENT_CREATED",
    afterState: { full_name: fullName.trim(), care_status: careStatus, risk_level: riskLevel },
    reason: "patient_create",
  });

  return;
}

export async function updatePatient(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(STAFF_WRITE_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const patientId = formData.get("patientId") as string;
  if (!patientId) throw new Error("Patient id is required");

  const fullName = (formData.get("fullName") as string) || null;
  const careStatus = (formData.get("careStatus") as string) || null;
  const riskLevel = (formData.get("riskLevel") as string) || null;
  const emergencyFlag = formData.get("emergencyFlag") === "on";

  const { data: existing, error: existingError } = await supabase
    .from("org_patients")
    .select("id, organization_id, full_name, care_status, risk_level, emergency_flag")
    .eq("id", patientId)
    .eq("organization_id", membership.orgId)
    .maybeSingle();

  if (existingError || !existing) throw new Error("Patient not found");

  const { error } = await supabase
    .from("org_patients")
    .update({
      full_name: fullName ?? existing.full_name,
      care_status: careStatus ?? existing.care_status,
      risk_level: riskLevel ?? existing.risk_level,
      emergency_flag: emergencyFlag,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .eq("organization_id", membership.orgId);

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "patient",
    entityId: patientId,
    actionType: "PATIENT_UPDATED",
    beforeState: {
      full_name: existing.full_name,
      care_status: existing.care_status,
      risk_level: existing.risk_level,
      emergency_flag: existing.emergency_flag,
    },
    afterState: {
      full_name: fullName ?? existing.full_name,
      care_status: careStatus ?? existing.care_status,
      risk_level: riskLevel ?? existing.risk_level,
      emergency_flag: emergencyFlag,
    },
    reason: "patient_update",
  });

  return;
}

export async function createIncident(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(STAFF_WRITE_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const patientId = (formData.get("patientId") as string) || null;
  const severity = (formData.get("severity") as string) || "low";
  const description = (formData.get("description") as string) || "";
  const occurredAt = (formData.get("occurredAt") as string) || null;

  if (!description.trim()) throw new Error("Incident description required");

  if (patientId) {
    const { data: patient, error: patientError } = await supabase
      .from("org_patients")
      .select("id")
      .eq("id", patientId)
      .eq("organization_id", membership.orgId)
      .maybeSingle();

    if (patientError || !patient) {
      throw new Error("Patient not found");
    }
  }

  const { data: incident, error } = await supabase
    .from("org_incidents")
    .insert({
      organization_id: membership.orgId,
      patient_id: patientId,
      reported_by: user.id,
      severity,
      status: "open",
      description: description.trim(),
      occurred_at: occurredAt || new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "incident",
    entityId: incident?.id ?? null,
    actionType: "INCIDENT_REPORTED",
    afterState: { patient_id: patientId, severity, status: "open" },
    reason: "incident_reported",
  });

  return;
}

export async function resolveIncident(input: FormData | string) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(ADMIN_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const incidentId =
    input instanceof FormData ? (input.get("incidentId") as string) : input;
  if (!incidentId) throw new Error("Incident id is required");

  const { data: incident, error: incidentError } = await supabase
    .from("org_incidents")
    .select("id, organization_id, status")
    .eq("id", incidentId)
    .eq("organization_id", membership.orgId)
    .maybeSingle();

  if (incidentError || !incident) throw new Error("Incident not found");

  const { error } = await supabase
    .from("org_incidents")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", incidentId)
    .eq("organization_id", membership.orgId);

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "incident",
    entityId: incidentId,
    beforeState: { status: incident.status },
    afterState: { status: "resolved" },
    actionType: "INCIDENT_RESOLVED",
    reason: "incident_resolved",
  });

  return;
}

export async function startShift(input?: FormData | string | null) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(STAFF_WRITE_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const patientId =
    input instanceof FormData ? ((input.get("patientId") as string) || null) : (input ?? null);

  if (patientId) {
    const { data: patient, error: patientError } = await supabase
      .from("org_patients")
      .select("id")
      .eq("id", patientId)
      .eq("organization_id", membership.orgId)
      .maybeSingle();

    if (patientError || !patient) {
      throw new Error("Patient not found");
    }
  }

  const { data: shift, error } = await supabase
    .from("org_shifts")
    .insert({
      organization_id: membership.orgId,
      patient_id: patientId || null,
      staff_user_id: user.id,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "shift",
    entityId: shift?.id ?? null,
    actionType: "SHIFT_STARTED",
    afterState: { patient_id: patientId ?? null, status: "active" },
    reason: "shift_start",
  });

  return;
}

export async function endShift(input: FormData | string) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(STAFF_WRITE_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const shiftId = input instanceof FormData ? (input.get("shiftId") as string) : input;
  if (!shiftId) throw new Error("Shift id is required");

  const isAdmin = ADMIN_ROLES.has(membership.role);
  const shiftQuery = supabase
    .from("org_shifts")
    .select("id, organization_id, status")
    .eq("id", shiftId)
    .eq("organization_id", membership.orgId);

  const { data: shift, error: shiftError } = isAdmin
    ? await shiftQuery.maybeSingle()
    : await shiftQuery.eq("staff_user_id", user.id).maybeSingle();

  if (shiftError || !shift) throw new Error("Shift not found");

  const { error } = await supabase
    .from("org_shifts")
    .update({ status: "complete", ended_at: new Date().toISOString() })
    .eq("id", shiftId)
    .eq("organization_id", membership.orgId);

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "shift",
    entityId: shiftId,
    beforeState: { status: shift.status },
    afterState: { status: "complete" },
    actionType: "SHIFT_COMPLETED",
    reason: "shift_complete",
  });

  return;
}
