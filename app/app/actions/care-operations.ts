'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { insertOrgTaskCompat } from '@/lib/tasks/persistence';
import { actionError, isNextInternalError } from '@/lib/actions/safe';
import { logAuditEvent } from '@/app/app/actions/audit-events';

async function requireUserOrganization(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership?.organization_id) {
    throw new Error('No organization found');
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
    if (!user) redirect('/auth/signin');

    // Get user's organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) throw new Error('No organization found');

    const participant = {
      organization_id: membership.organization_id,
      full_name: formData.get('full_name') as string,
      preferred_name: (formData.get('preferred_name') as string) || null,
      external_id: (formData.get('external_id') as string) || null,
      date_of_birth: (formData.get('date_of_birth') as string) || null,
      gender: (formData.get('gender') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      address: (formData.get('address') as string) || null,
      emergency_contact_name:
        (formData.get('emergency_contact_name') as string) || null,
      emergency_contact_phone:
        (formData.get('emergency_contact_phone') as string) || null,
      emergency_contact_relationship:
        (formData.get('emergency_contact_relationship') as string) || null,
      care_status: (formData.get('care_status') as string) || 'active',
      risk_level: (formData.get('risk_level') as string) || 'low',
      emergency_flag: formData.get('emergency_flag') === 'true',
      ndis_number: (formData.get('ndis_number') as string) || null,
      funding_type: (formData.get('funding_type') as string) || null,
      plan_start_date: (formData.get('plan_start_date') as string) || null,
      plan_end_date: (formData.get('plan_end_date') as string) || null,
      primary_diagnosis: (formData.get('primary_diagnosis') as string) || null,
      communication_needs:
        (formData.get('communication_needs') as string) || null,
      cultural_considerations:
        (formData.get('cultural_considerations') as string) || null,
      created_by: user.id,
    };

    // v4-020: need the inserted id for the audit log entityId; the
    // round-trip is cheap and PHI mutations are auditable under
    // HIPAA §164.312(b) / NDIS Quality & Safeguards.
    const { data: inserted, error } = await supabase
      .from('org_patients')
      .insert(participant)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'patient',
        entityId: inserted?.id ?? null,
        actionType: 'PATIENT_CREATED',
        afterState: {
          full_name: participant.full_name,
          care_status: participant.care_status,
          risk_level: participant.risk_level,
          has_ndis_number: Boolean(participant.ndis_number),
        },
        reason: 'create_participant',
      },
      { required: true },
    );

    revalidatePath('/app/participants');
    redirect('/app/participants');
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
    if (!user) redirect('/auth/signin');
    const organizationId = await requireUserOrganization(supabase, user.id);

    const updates = {
      full_name: formData.get('full_name') as string,
      preferred_name: (formData.get('preferred_name') as string) || null,
      external_id: (formData.get('external_id') as string) || null,
      date_of_birth: (formData.get('date_of_birth') as string) || null,
      gender: (formData.get('gender') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      address: (formData.get('address') as string) || null,
      emergency_contact_name:
        (formData.get('emergency_contact_name') as string) || null,
      emergency_contact_phone:
        (formData.get('emergency_contact_phone') as string) || null,
      emergency_contact_relationship:
        (formData.get('emergency_contact_relationship') as string) || null,
      care_status: formData.get('care_status') as string,
      risk_level: formData.get('risk_level') as string,
      emergency_flag: formData.get('emergency_flag') === 'true',
      ndis_number: (formData.get('ndis_number') as string) || null,
      funding_type: (formData.get('funding_type') as string) || null,
      primary_diagnosis: (formData.get('primary_diagnosis') as string) || null,
      communication_needs:
        (formData.get('communication_needs') as string) || null,
      updated_by: user.id,
    };

    const { error } = await supabase
      .from('org_patients')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'patient',
        entityId: id,
        actionType: 'PATIENT_UPDATED',
        afterState: {
          care_status: updates.care_status,
          risk_level: updates.risk_level,
          emergency_flag: updates.emergency_flag,
        },
        reason: 'update_participant',
      },
      { required: true },
    );

    revalidatePath(`/app/participants/${id}`);
    revalidatePath('/app/participants');
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
    if (!user) redirect('/auth/signin');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) throw new Error('No organization found');

    const visit = {
      organization_id: membership.organization_id,
      client_id: (formData.get('client_id') as string) || null,
      staff_id: (formData.get('staff_id') as string) || user.id,
      visit_type: (formData.get('visit_type') as string) || 'service',
      service_category: (formData.get('service_category') as string) || null,
      scheduled_start: formData.get('scheduled_start') as string,
      scheduled_end: (formData.get('scheduled_end') as string) || null,
      status: 'scheduled',
      location_type: (formData.get('location_type') as string) || null,
      address: (formData.get('address') as string) || null,
      notes: (formData.get('notes') as string) || null,
      billable: formData.get('billable') !== 'false',
      funding_source: (formData.get('funding_source') as string) || null,
      created_by: user.id,
    };

    const { data: insertedVisit, error } = await supabase
      .from('org_visits')
      .insert(visit)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'visit',
        entityId: insertedVisit?.id ?? null,
        actionType: 'VISIT_CREATED',
        afterState: {
          client_id: visit.client_id,
          staff_id: visit.staff_id,
          visit_type: visit.visit_type,
          scheduled_start: visit.scheduled_start,
          billable: visit.billable,
        },
        reason: 'create_visit',
      },
      { required: true },
    );

    revalidatePath('/app/visits');
    redirect('/app/visits');
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updateVisitStatus(
  id: string,
  status: string,
  notes?: string,
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/auth/signin');
    const organizationId = await requireUserOrganization(supabase, user.id);

    const updates: Record<string, any> = { status };

    if (status === 'in_progress') {
      updates.actual_start = new Date().toISOString();
    } else if (status === 'completed') {
      updates.actual_end = new Date().toISOString();
      if (notes) updates.outcomes = notes;
    } else if (status === 'cancelled' || status === 'missed') {
      if (notes) updates.cancellation_reason = notes;
    }

    const { error } = await supabase
      .from('org_visits')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'visit',
        entityId: id,
        actionType: 'VISIT_STATUS_UPDATED',
        afterState: { status, has_notes: Boolean(notes) },
        reason: 'update_visit_status',
      },
      { required: true },
    );

    revalidatePath('/app/visits');
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
    if (!user) redirect('/auth/signin');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) throw new Error('No organization found');

    const incident = {
      organization_id: membership.organization_id,
      patient_id: (formData.get('patient_id') as string) || null,
      reported_by: user.id,
      incident_type: (formData.get('incident_type') as string) || 'general',
      severity: (formData.get('severity') as string) || 'low',
      status: 'open',
      description: formData.get('description') as string,
      occurred_at:
        (formData.get('occurred_at') as string) || new Date().toISOString(),
      location: (formData.get('location') as string) || null,
      immediate_actions: (formData.get('immediate_actions') as string) || null,
      follow_up_required: formData.get('follow_up_required') === 'true',
      follow_up_due_date:
        (formData.get('follow_up_due_date') as string) || null,
    };

    const { data: insertedIncident, error } = await supabase
      .from('org_incidents')
      .insert(incident)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'incident',
        entityId: insertedIncident?.id ?? null,
        actionType: 'INCIDENT_CREATED',
        afterState: {
          patient_id: incident.patient_id,
          incident_type: incident.incident_type,
          severity: incident.severity,
          occurred_at: incident.occurred_at,
          follow_up_required: incident.follow_up_required,
        },
        reason: 'create_incident',
      },
      { required: true },
    );

    // Create follow-up task if required
    if (incident.follow_up_required) {
      await insertOrgTaskCompat(supabase, {
        organization_id: membership.organization_id,
        title: `Follow-up: Incident - ${incident.incident_type}`,
        description: `Follow up on incident: ${incident.description?.substring(0, 100)}...`,
        priority:
          incident.severity === 'critical'
            ? 'critical'
            : incident.severity === 'high'
              ? 'high'
              : 'medium',
        due_date: incident.follow_up_due_date,
        status: 'pending',
        created_by: user.id,
        patient_id: incident.patient_id,
      });
    }

    revalidatePath('/app/incidents');
    redirect('/app/incidents');
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
    if (!user) redirect('/auth/signin');
    const organizationId = await requireUserOrganization(supabase, user.id);

    const rootCause = (formData.get('root_cause') as string) || null;
    const preventiveMeasures =
      (formData.get('preventive_measures') as string) || null;
    const resolvedAt = new Date().toISOString();

    const { error } = await supabase
      .from('org_incidents')
      .update({
        status: 'resolved',
        resolved_at: resolvedAt,
        resolved_by: user.id,
        root_cause: rootCause,
        preventive_measures: preventiveMeasures,
        follow_up_completed_at: resolvedAt,
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'incident',
        entityId: id,
        actionType: 'INCIDENT_RESOLVED',
        afterState: {
          status: 'resolved',
          resolved_at: resolvedAt,
          has_root_cause: Boolean(rootCause),
        },
        reason: 'incident_resolution',
      },
      { required: true },
    );

    revalidatePath('/app/incidents');
    revalidatePath(`/app/incidents/${id}`);
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

// =========================================================
// STAFF CREDENTIAL ACTIONS
// =========================================================

const STAFF_CREDENTIAL_WRITE_ROLES = new Set([
  'owner',
  'admin',
  'compliance_officer',
  'manager',
]);

const STAFF_CREDENTIAL_VERIFIER_ROLES = new Set([
  'owner',
  'admin',
  'compliance_officer',
]);

export async function createStaffCredential(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/auth/signin');

    // Fetch the actor's membership including role so we can gate who can
    // register credentials and validate the target user belongs to the same org.
    const { data: actorMembership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!actorMembership) throw new Error('No organization found');

    const actorRole = (actorMembership.role as string | null) ?? '';
    if (!STAFF_CREDENTIAL_WRITE_ROLES.has(actorRole)) {
      throw new Error(
        'Forbidden: only owner/admin/compliance/manager roles can register staff credentials.',
      );
    }

    const targetUserIdRaw = (formData.get('user_id') as string | null) ?? '';
    const targetUserId = targetUserIdRaw.trim() || user.id;

    // Validate the target user is a member of the same organization. Without
    // this check, any org member could register credentials against an
    // arbitrary user_id (audit P1 #12).
    if (targetUserId !== user.id) {
      const { data: targetMembership } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('user_id', targetUserId)
        .eq('organization_id', actorMembership.organization_id)
        .maybeSingle();

      if (!targetMembership) {
        throw new Error('Target user is not a member of this organization.');
      }
    }

    const credential = {
      organization_id: actorMembership.organization_id,
      user_id: targetUserId,
      credential_type: formData.get('credential_type') as string,
      credential_name: formData.get('credential_name') as string,
      credential_number: (formData.get('credential_number') as string) || null,
      issuing_authority: (formData.get('issuing_authority') as string) || null,
      issue_date: (formData.get('issue_date') as string) || null,
      expiry_date: (formData.get('expiry_date') as string) || null,
      status: 'pending',
      notes: (formData.get('notes') as string) || null,
      created_by: user.id,
    };

    const { data: insertedCredential, error } = await supabase
      .from('org_staff_credentials')
      .insert(credential)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    // Audit-log the registration so the trail isn't asymmetric with
    // verifyStaffCredential (which already logs).
    await logAuditEvent(
      {
        organizationId: actorMembership.organization_id,
        actorUserId: user.id,
        actorRole,
        entityType: 'staff_credential',
        entityId: insertedCredential?.id ?? null,
        actionType: 'STAFF_CREDENTIAL_CREATED',
        afterState: {
          target_user_id: targetUserId,
          credential_type: credential.credential_type,
          credential_name: credential.credential_name,
          expiry_date: credential.expiry_date,
          status: credential.status,
        },
        reason: 'credential_registration',
      },
      { required: false },
    );

    // Create reminder task if expiry date is set
    if (credential.expiry_date) {
      const expiryDate = new Date(credential.expiry_date);
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - 30); // 30 days before expiry

      await insertOrgTaskCompat(supabase, {
        organization_id: actorMembership.organization_id,
        title: `Credential Expiring: ${credential.credential_name}`,
        description: `${credential.credential_type} credential expires on ${expiryDate.toLocaleDateString()}`,
        priority: 'high',
        due_date: reminderDate.toISOString(),
        status: 'pending',
        created_by: user.id,
      });
    }

    revalidatePath('/app/staff-compliance');
    redirect('/app/staff-compliance');
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
    if (!user) redirect('/auth/signin');

    // Verifier role gate. Previously any org member could flip credentials
    // to verified, which is unacceptable for regulated workforce proof
    // (audit P1 #12).
    const { data: actorMembership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!actorMembership) throw new Error('No organization found');

    const actorRole = (actorMembership.role as string | null) ?? '';
    if (!STAFF_CREDENTIAL_VERIFIER_ROLES.has(actorRole)) {
      throw new Error(
        'Forbidden: only owner/admin/compliance roles can verify credentials.',
      );
    }

    const organizationId = actorMembership.organization_id;
    const { count: evidenceCount, error: evidenceError } = await supabase
      .from('org_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('entity_type', 'staff_credential')
      .eq('entity_id', id);

    if (evidenceError) throw new Error(evidenceError.message);
    if ((evidenceCount ?? 0) === 0) {
      throw new Error(
        'Attach credential evidence before verifying this staff credential.',
      );
    }

    const verifiedAt = new Date().toISOString();
    const { error } = await supabase
      .from('org_staff_credentials')
      .update({
        status: 'verified',
        verified_at: verifiedAt,
        verified_by: user.id,
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId,
        actorUserId: user.id,
        actorRole,
        entityType: 'staff_credential',
        entityId: id,
        actionType: 'STAFF_CREDENTIAL_VERIFIED',
        afterState: { status: 'verified', verified_at: verifiedAt },
        reason: 'credential_verification',
      },
      { required: true },
    );

    revalidatePath('/app/staff-compliance');
    revalidatePath(`/app/staff-compliance/${id}`);
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
    if (!user) redirect('/auth/signin');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) throw new Error('No organization found');

    const carePlan = {
      organization_id: membership.organization_id,
      client_id: formData.get('client_id') as string,
      plan_type: (formData.get('plan_type') as string) || 'support',
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      start_date: formData.get('start_date') as string,
      end_date: (formData.get('end_date') as string) || null,
      review_date: (formData.get('review_date') as string) || null,
      status: 'draft',
      created_by: user.id,
    };

    const { data: insertedPlan, error } = await supabase
      .from('org_care_plans')
      .insert(carePlan)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId: membership.organization_id,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'care_plan',
        entityId: insertedPlan?.id ?? null,
        actionType: 'CARE_PLAN_CREATED',
        afterState: {
          client_id: carePlan.client_id,
          plan_type: carePlan.plan_type,
          title: carePlan.title,
          start_date: carePlan.start_date,
        },
        reason: 'create_care_plan',
      },
      { required: true },
    );

    revalidatePath('/app/care-plans');
    redirect('/app/care-plans');
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

const CARE_PLAN_STATUSES = [
  'draft',
  'active',
  'review',
  'under_review',
  'completed',
  'expired',
  'archived',
] as const;
type CarePlanStatus = (typeof CARE_PLAN_STATUSES)[number];

export async function updateCarePlanStatus(planId: string, nextStatus: string) {
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

    await logAuditEvent(
      {
        organizationId: orgId,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'care_plan',
        entityId: planId,
        actionType: 'CARE_PLAN_STATUS_CHANGED',
        beforeState: { status: existing.status },
        afterState: { status: nextStatus },
        reason: `${existing.status} → ${nextStatus}`,
      },
      { required: true },
    );

    revalidatePath('/app/care-plans');
    revalidatePath('/app/care-plans/journey');
    revalidatePath(`/app/care-plans/${planId}`);
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updateCarePlan(planId: string, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionError(new Error('Not authenticated'));

    const orgId = await requireUserOrganization(supabase, user.id);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const title = formData.get('title');
    const description = formData.get('description');
    const startDate = formData.get('start_date');
    const endDate = formData.get('end_date');
    const reviewDate = formData.get('review_date');

    if (typeof title === 'string' && title.trim()) updates.title = title.trim();
    if (typeof description === 'string')
      updates.description = description.trim();
    if (typeof startDate === 'string' && startDate)
      updates.start_date = startDate;
    if (typeof endDate === 'string' && endDate) updates.end_date = endDate;
    if (typeof reviewDate === 'string' && reviewDate)
      updates.review_date = reviewDate;

    const { error: updateErr } = await supabase
      .from('org_care_plans')
      .update(updates)
      .eq('id', planId)
      .eq('organization_id', orgId);

    if (updateErr) return actionError(updateErr);

    await logAuditEvent(
      {
        organizationId: orgId,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'care_plan',
        entityId: planId,
        actionType: 'CARE_PLAN_UPDATED',
        afterState: updates,
      },
      { required: false },
    );

    revalidatePath('/app/care-plans');
    revalidatePath(`/app/care-plans/${planId}`);
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

// =========================================================
// CARE GOALS & SUPPORTS (JSONB-backed on org_care_plans)
// =========================================================

import {
  normalizeGoal,
  normalizeSupport,
  type CareGoal,
  type CareSupport,
  type GoalStatus,
  type SupportStatus,
} from '@/lib/care-plans/normalize';

async function loadPlanForWrite(planId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const orgId = await requireUserOrganization(supabase, user.id);

  const { data: plan, error } = await supabase
    .from('org_care_plans')
    .select('id, organization_id, goals, supports, status')
    .eq('id', planId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) throw error;
  if (!plan) throw new Error('Care plan not found');

  const goals = Array.isArray(plan.goals)
    ? (plan.goals as unknown[]).map(normalizeGoal)
    : [];
  const supports = Array.isArray(plan.supports)
    ? (plan.supports as unknown[]).map(normalizeSupport)
    : [];

  return { supabase, orgId, plan, goals, supports };
}

async function persistPlan(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  planId: string,
  orgId: string,
  patch: { goals?: CareGoal[]; supports?: CareSupport[] },
) {
  // Tenancy is enforced by RLS (care_plans_org_isolation) plus the explicit
  // id + organization_id filters below — the authenticated user must be a
  // member of orgId for the UPDATE to succeed.
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.goals) update.goals = patch.goals;
  if (patch.supports) update.supports = patch.supports;
  const { error } = await supabase
    .from('org_care_plans')
    .update(update)
    .eq('id', planId)
    .eq('organization_id', orgId);
  if (error) throw error;
  revalidatePath(`/app/care-plans/${planId}`);
  revalidatePath('/app/care-plans');
}

export async function createGoal(planId: string, formData: FormData) {
  try {
    const title = String(formData.get('title') ?? '').trim();
    if (!title) return actionError(new Error('Title is required'));
    const description = String(formData.get('description') ?? '').trim();
    const targetDate = String(formData.get('target_date') ?? '').trim();

    const { supabase, orgId, goals } = await loadPlanForWrite(planId);

    const goal: CareGoal = normalizeGoal({
      id: crypto.randomUUID(),
      title,
      description: description || null,
      status: 'pending',
      target_date: targetDate || null,
      progress_percentage: 0,
      created_at: new Date().toISOString(),
    });

    await persistPlan(supabase, planId, orgId, { goals: [...goals, goal] });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logAuditEvent(
      {
        organizationId: orgId,
        actorUserId: user?.id ?? null,
        actorRole: null,
        entityType: 'care_goal',
        entityId: goal.id,
        actionType: 'CARE_GOAL_CREATED',
        afterState: {
          plan_id: planId,
          title: goal.title,
          target_date: goal.target_date,
        },
        reason: 'create_care_goal',
      },
      { required: true },
    );

    return { success: true as const, goalId: goal.id };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updateGoal(
  planId: string,
  goalId: string,
  patch: {
    title?: string;
    description?: string | null;
    status?: GoalStatus;
    target_date?: string | null;
    progress_percentage?: number;
  },
) {
  try {
    const { supabase, orgId, goals, supports } = await loadPlanForWrite(planId);
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx === -1) return actionError(new Error('Goal not found'));

    const next = normalizeGoal({ ...goals[idx], ...patch });

    if (next.status === 'achieved') next.progress_percentage = 100;
    if (next.status === 'pending' && patch.progress_percentage === undefined) {
      next.progress_percentage = 0;
    }

    const updatedGoals = [...goals];
    updatedGoals[idx] = next;

    await persistPlan(supabase, planId, orgId, {
      goals: updatedGoals,
      supports,
    });
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function deleteGoal(planId: string, goalId: string) {
  try {
    const { supabase, orgId, goals, supports } = await loadPlanForWrite(planId);
    const remainingGoals = goals.filter((g) => g.id !== goalId);
    if (remainingGoals.length === goals.length) {
      return actionError(new Error('Goal not found'));
    }
    const remainingSupports = supports.filter((s) => s.goal_id !== goalId);
    await persistPlan(supabase, planId, orgId, {
      goals: remainingGoals,
      supports: remainingSupports,
    });
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function createSupport(planId: string, formData: FormData) {
  try {
    const goalId = String(formData.get('goal_id') ?? '').trim();
    if (!goalId) return actionError(new Error('Goal is required'));
    const description = String(formData.get('description') ?? '').trim();
    if (!description) return actionError(new Error('Description is required'));
    const assignedTo = String(formData.get('assigned_to') ?? '').trim();
    const frequency = String(formData.get('frequency') ?? '').trim();

    const { supabase, orgId, goals, supports } = await loadPlanForWrite(planId);
    if (!goals.some((g) => g.id === goalId)) {
      return actionError(new Error('Parent goal not found'));
    }

    const support: CareSupport = normalizeSupport({
      id: crypto.randomUUID(),
      goal_id: goalId,
      description,
      assigned_to: assignedTo || null,
      frequency: frequency || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    await persistPlan(supabase, planId, orgId, {
      supports: [...supports, support],
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logAuditEvent(
      {
        organizationId: orgId,
        actorUserId: user?.id ?? null,
        actorRole: null,
        entityType: 'care_support',
        entityId: support.id,
        actionType: 'CARE_SUPPORT_CREATED',
        afterState: {
          plan_id: planId,
          goal_id: goalId,
          assigned_to: support.assigned_to,
          frequency: support.frequency,
        },
        reason: 'create_care_support',
      },
      { required: true },
    );

    return { success: true as const, supportId: support.id };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function updateSupport(
  planId: string,
  supportId: string,
  patch: {
    description?: string;
    assigned_to?: string | null;
    frequency?: string | null;
    status?: SupportStatus;
  },
) {
  try {
    const { supabase, orgId, supports } = await loadPlanForWrite(planId);
    const idx = supports.findIndex((s) => s.id === supportId);
    if (idx === -1) return actionError(new Error('Support not found'));

    const next = normalizeSupport({ ...supports[idx], ...patch });
    const updated = [...supports];
    updated[idx] = next;

    await persistPlan(supabase, planId, orgId, { supports: updated });
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function deleteSupport(planId: string, supportId: string) {
  try {
    const { supabase, orgId, supports } = await loadPlanForWrite(planId);
    const remaining = supports.filter((s) => s.id !== supportId);
    if (remaining.length === supports.length) {
      return actionError(new Error('Support not found'));
    }
    await persistPlan(supabase, planId, orgId, { supports: remaining });
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function syncCarePlanProgress(planId: string) {
  try {
    const { supabase, orgId, plan, goals } = await loadPlanForWrite(planId);
    if (goals.length === 0) return { success: true as const };

    const allAchieved = goals.every((g) => g.status === 'achieved');
    const anyActive = goals.some((g) => g.status !== 'pending');

    let nextStatus: string | null = null;
    if (allAchieved && plan.status !== 'archived') nextStatus = 'active';
    else if (anyActive && plan.status === 'draft') nextStatus = 'active';

    if (!nextStatus) return { success: true as const };

    await supabase
      .from('org_care_plans')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('organization_id', orgId);

    revalidatePath(`/app/care-plans/${planId}`);
    return { success: true as const, status: nextStatus };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
