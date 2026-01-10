"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserOrgMembership, RoleKey } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

const NOTE_WRITE_ROLES = new Set<RoleKey>(["OWNER", "COMPLIANCE_OFFICER", "MANAGER", "STAFF"]);
const NOTE_SIGNOFF_ROLES = new Set<RoleKey>(["OWNER", "COMPLIANCE_OFFICER", "MANAGER"]);

async function requireRole(allowed: Set<RoleKey>) {
  const membership = await getUserOrgMembership();
  if (!allowed.has(membership.role)) {
    throw new Error("Access denied");
  }
  return membership;
}

export async function createProgressNote(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(NOTE_WRITE_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const patientId = formData.get("patientId") as string;
  const noteText = (formData.get("noteText") as string) || "";
  const statusTag = (formData.get("statusTag") as string) || "routine";

  if (!patientId) throw new Error("Patient is required");
  if (!noteText.trim()) throw new Error("Note text is required");

  const { data: patient, error: patientError } = await supabase
    .from("org_patients")
    .select("id")
    .eq("id", patientId)
    .eq("organization_id", membership.orgId)
    .maybeSingle();

  if (patientError || !patient) throw new Error("Patient not found");

  const { data: note, error } = await supabase
    .from("org_progress_notes")
    .insert({
      organization_id: membership.orgId,
      patient_id: patientId,
      staff_user_id: user.id,
      note_text: noteText.trim(),
      status_tag: statusTag,
    })
    .select("id")
    .maybeSingle();

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "progress_note",
    entityId: note?.id ?? null,
    actionType: "PROGRESS_NOTE_CREATED",
    afterState: { patient_id: patientId, status_tag: statusTag },
    reason: "progress_note_create",
  });

  return;
}

export async function signOffProgressNote(input: FormData | string) {
  const supabase = await createSupabaseServerClient();
  const membership = await requireRole(NOTE_SIGNOFF_ROLES);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const noteId = input instanceof FormData ? (input.get("noteId") as string) : input;
  if (!noteId) throw new Error("Note id is required");

  const { data: note, error: noteError } = await supabase
    .from("org_progress_notes")
    .select("id, organization_id, signed_off_by")
    .eq("id", noteId)
    .eq("organization_id", membership.orgId)
    .maybeSingle();

  if (noteError || !note) throw new Error("Note not found");
  if (note.signed_off_by) {
    return;
  }

  const { error } = await supabase
    .from("org_progress_notes")
    .update({ signed_off_by: user.id, signed_off_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("organization_id", membership.orgId);

  if (error) throw error;

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "progress_note",
    entityId: noteId,
    actionType: "PROGRESS_NOTE_SIGNED_OFF",
    afterState: { signed_off_by: user.id },
    reason: "progress_note_signoff",
  });

  return;
}
