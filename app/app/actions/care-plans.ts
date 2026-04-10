'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ---- Care Plan CRUD ----

export async function getCarePlan(planId: string, orgId: string) {
  const db = await createSupabaseServerClient();
  const { data: plan } = await db
    .from('org_care_plans')
    .select('*, org_patients(id, first_name, last_name)')
    .eq('id', planId)
    .eq('org_id', orgId)
    .single();

  if (!plan) return null;

  const { data: goals } = await db
    .from('org_care_goals')
    .select('*')
    .eq('care_plan_id', planId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });

  return { ...plan, goals: goals ?? [] };
}

export async function updateCarePlan(
  planId: string,
  orgId: string,
  updates: Record<string, unknown>,
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_care_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/app/care-plans');
  return data;
}

export async function transitionPlanStatus(
  planId: string,
  orgId: string,
  newStatus: 'draft' | 'active' | 'review' | 'completed' | 'archived',
  _reason?: string,
) {
  const db = await createSupabaseServerClient();
  const { data: current } = await db
    .from('org_care_plans')
    .select('status')
    .eq('id', planId)
    .eq('org_id', orgId)
    .single();

  if (!current) throw new Error('Care plan not found');

  // Validate transitions
  const allowedTransitions: Record<string, string[]> = {
    draft: ['active'],
    active: ['review', 'completed', 'archived'],
    review: ['active', 'completed'],
    completed: ['archived'],
    archived: [],
  };

  const allowed = allowedTransitions[current.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${current.status} to ${newStatus}`);
  }

  const { data, error } = await db
    .from('org_care_plans')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/app/care-plans');
  return data;
}

export async function duplicateCarePlan(
  planId: string,
  orgId: string,
  createdBy: string,
) {
  const db = await createSupabaseServerClient();
  const { data: source } = await db
    .from('org_care_plans')
    .select('*')
    .eq('id', planId)
    .eq('org_id', orgId)
    .single();

  if (!source) throw new Error('Care plan not found');

  const {
    id: _id,
    created_at: _created_at,
    updated_at: _updated_at,
    status: _status,
    ...fields
  } = source;
  const { data, error } = await db
    .from('org_care_plans')
    .insert({ ...fields, status: 'draft', created_by: createdBy })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/app/care-plans');
  return data;
}

// ---- Goal CRUD ----

export async function createGoal(
  planId: string,
  orgId: string,
  goalData: {
    goal_text: string;
    category: string;
    target_date?: string;
    measurement_method?: string;
    baseline_value?: string;
    target_value?: string;
    created_by?: string;
    participant_id?: string;
  },
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_care_goals')
    .insert({
      care_plan_id: planId,
      org_id: orgId,
      ...goalData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/app/care-plans/${planId}`);
  return data;
}

export async function updateGoal(
  goalId: string,
  orgId: string,
  updates: Record<string, unknown>,
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_care_goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function recordGoalProgress(
  goalId: string,
  orgId: string,
  entry: {
    value: string;
    notes?: string;
    recorded_by?: string;
    evidence_ids?: string[];
  },
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_goal_progress_entries')
    .insert({
      goal_id: goalId,
      org_id: orgId,
      value: entry.value,
      notes: entry.notes,
      recorded_by: entry.recorded_by,
      evidence_ids: entry.evidence_ids ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getGoalHistory(goalId: string, orgId: string) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('org_goal_progress_entries')
    .select('*')
    .eq('goal_id', goalId)
    .eq('org_id', orgId)
    .order('recorded_at', { ascending: true });

  return data ?? [];
}

// ---- Medication Actions ----

export async function createMedication(
  orgId: string,
  participantId: string,
  med: {
    name: string;
    dosage?: string;
    frequency?: string;
    route?: string;
    prescribed_by?: string;
    start_date?: string;
    end_date?: string;
    instructions?: string;
    precautions?: string;
    is_prn?: boolean;
    created_by?: string;
  },
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_medications')
    .insert({ org_id: orgId, participant_id: participantId, ...med })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/app/participants/${participantId}/medications`);
  return data;
}

export async function discontinueMedication(medId: string, orgId: string) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_medications')
    .update({ status: 'discontinued', updated_at: new Date().toISOString() })
    .eq('id', medId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function recordMedicationAdministration(
  orgId: string,
  entry: {
    medication_id: string;
    participant_id: string;
    administered_by?: string;
    dose_given?: string;
    status: 'given' | 'withheld' | 'refused' | 'self_administered';
    notes?: string;
    witness_id?: string;
  },
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_medication_administrations')
    .insert({ org_id: orgId, ...entry })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMedicationHistory(
  orgId: string,
  participantId: string,
) {
  const db = await createSupabaseServerClient();

  const { data: meds } = await db
    .from('org_medications')
    .select('*')
    .eq('org_id', orgId)
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false });

  return meds ?? [];
}

export async function getMedicationAdminLog(
  orgId: string,
  medicationId: string,
) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('org_medication_administrations')
    .select('*')
    .eq('org_id', orgId)
    .eq('medication_id', medicationId)
    .order('administered_at', { ascending: false });

  return data ?? [];
}
