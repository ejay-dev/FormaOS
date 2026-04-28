"use server";

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchSystemState } from '@/lib/system-state/server';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import {
  CAPA_STATUS_LABELS,
  CAPA_STATUSES,
  type CapaStatus,
} from './constants';

const CAPA_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
const CAPA_TYPES = ['corrective', 'preventive'] as const;
const CAPA_SOURCE_TYPES = ['incident', 'obligation', 'policy', 'manual'] as const;

const TRANSITIONS: Record<CapaStatus, CapaStatus[]> = {
  draft: ['open', 'archived'],
  open: ['investigating', 'action_assigned', 'archived'],
  investigating: ['action_assigned', 'archived'],
  action_assigned: ['verification', 'investigating', 'archived'],
  verification: ['closed', 'action_assigned', 'archived'],
  closed: ['archived'],
  archived: [],
};

type CapaActionContext = {
  db: ReturnType<typeof createSupabaseAdminClient>;
  orgId: string;
  userId: string;
  role: string;
};

type CapaRecord = {
  id: string;
  status: CapaStatus;
  title?: string | null;
  owner_id?: string | null;
  assigned_to?: string | null;
  root_cause?: string | null;
  corrective_action?: string | null;
  preventive_action?: string | null;
  verification_notes?: string | null;
};

function asString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function normalizeOptionalUuid(value: string) {
  return value.length > 0 ? value : null;
}

function isCapaStatus(value: string): value is CapaStatus {
  return CAPA_STATUSES.includes(value as CapaStatus);
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getCapaActionContext(): Promise<CapaActionContext> {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  if (!['owner', 'admin'].includes(state.role)) {
    redirectWithError('/app/capa', 'CAPA changes require an admin or manager role.');
  }

  return {
    db: createSupabaseAdminClient(),
    orgId: state.organization.id,
    userId: state.user.id,
    role: state.role,
  };
}

async function loadCapa(ctx: CapaActionContext, id: string) {
  const { data, error } = await ctx.db
    .from('org_capa_items')
    .select(
      'id, title, status, owner_id, assigned_to, root_cause, corrective_action, preventive_action, verification_notes',
    )
    .eq('id', id)
    .eq('organization_id', ctx.orgId)
    .maybeSingle();

  if (error) redirectWithError('/app/capa', error.message);
  if (!data) notFound();
  return data as CapaRecord;
}

async function writeCapaEvent(
  ctx: CapaActionContext,
  capaId: string,
  eventType: string,
  options: {
    comment?: string | null;
    beforeState?: unknown;
    afterState?: unknown;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const { error } = await ctx.db.from('org_capa_events').insert({
    organization_id: ctx.orgId,
    capa_id: capaId,
    event_type: eventType,
    actor_id: ctx.userId,
    comment: options.comment ?? null,
    metadata: {
      ...(options.metadata ?? {}),
      before_state: options.beforeState ?? null,
      after_state: options.afterState ?? null,
    },
  });
  if (error && !isMissingSupabaseTableError(error, 'org_capa_events')) {
    throw new Error(`Failed to write CAPA event: ${error.message}`);
  }

  await logAuditEvent(
    {
      organizationId: ctx.orgId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      entityType: 'capa',
      entityId: capaId,
      actionType: eventType,
      beforeState: options.beforeState,
      afterState: options.afterState,
      reason: options.comment ?? 'capa_workflow',
    },
    { required: true },
  );
}

function revalidateCapa(capaId?: string) {
  revalidatePath('/app/capa');
  revalidatePath('/app');
  if (capaId) revalidatePath(`/app/capa/${capaId}`);
}

export async function createCapa(formData: FormData) {
  const ctx = await getCapaActionContext();
  const title = asString(formData, 'title');
  const description = asString(formData, 'description');
  const type = asString(formData, 'type') || 'corrective';
  const severity = asString(formData, 'severity') || asString(formData, 'priority') || 'medium';
  const ownerId = normalizeOptionalUuid(asString(formData, 'owner_id'));
  const dueDate = asString(formData, 'due_date');
  const sourceType = asString(formData, 'source_type') || 'manual';
  const sourceId = normalizeOptionalUuid(asString(formData, 'source_id'));

  if (!title) redirectWithError('/app/capa/new', 'Title is required.');
  if (!CAPA_TYPES.includes(type as (typeof CAPA_TYPES)[number])) {
    redirectWithError('/app/capa/new', 'Invalid CAPA type.');
  }
  if (!CAPA_SEVERITIES.includes(severity as (typeof CAPA_SEVERITIES)[number])) {
    redirectWithError('/app/capa/new', 'Invalid severity.');
  }
  if (!CAPA_SOURCE_TYPES.includes(sourceType as (typeof CAPA_SOURCE_TYPES)[number])) {
    redirectWithError('/app/capa/new', 'Invalid source type.');
  }

  if (sourceType === 'incident' && sourceId) {
    const { data: incident } = await ctx.db
      .from('org_incidents')
      .select('id')
      .eq('id', sourceId)
      .eq('organization_id', ctx.orgId)
      .maybeSingle();
    if (!incident) redirectWithError('/app/capa/new', 'Linked incident was not found.');
  }

  const { data, error } = await ctx.db
    .from('org_capa_items')
    .insert({
      organization_id: ctx.orgId,
      title,
      description: description || null,
      type,
      priority: severity,
      severity,
      status: 'open',
      owner_id: ownerId,
      assigned_to: ownerId,
      due_date: dueDate || null,
      source_type: sourceType,
      source_id: sourceId,
      incident_id: sourceType === 'incident' ? sourceId : null,
      created_by: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) redirectWithError('/app/capa/new', error.message);

  await writeCapaEvent(ctx, data.id as string, 'CAPA_CREATED', {
    afterState: { title, type, severity, status: 'open', owner_id: ownerId, source_type: sourceType, source_id: sourceId },
    comment: 'capa_create_form',
  });

  revalidateCapa(data.id as string);
  redirect(`/app/capa/${data.id}`);
}

export async function updateCapa(formData: FormData) {
  const ctx = await getCapaActionContext();
  const id = asString(formData, 'id');
  if (!id) redirectWithError('/app/capa', 'CAPA id is required.');

  const existing = await loadCapa(ctx, id);
  const title = asString(formData, 'title');
  const description = asString(formData, 'description');
  const severity = asString(formData, 'severity') || 'medium';
  const dueDate = asString(formData, 'due_date');

  if (!title) redirectWithError(`/app/capa/${id}`, 'Title is required.');
  if (!CAPA_SEVERITIES.includes(severity as (typeof CAPA_SEVERITIES)[number])) {
    redirectWithError(`/app/capa/${id}`, 'Invalid severity.');
  }

  const patch = {
    title,
    description: description || null,
    priority: severity,
    severity,
    due_date: dueDate || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await ctx.db
    .from('org_capa_items')
    .update(patch)
    .eq('id', id)
    .eq('organization_id', ctx.orgId);

  if (error) redirectWithError(`/app/capa/${id}`, error.message);

  await writeCapaEvent(ctx, id, 'CAPA_UPDATED', {
    beforeState: existing,
    afterState: patch,
    comment: 'capa_detail_overview_form',
  });

  revalidateCapa(id);
  redirect(`/app/capa/${id}`);
}

export async function assignCapaOwner(formData: FormData) {
  const ctx = await getCapaActionContext();
  const id = asString(formData, 'id');
  const ownerId = normalizeOptionalUuid(asString(formData, 'owner_id'));
  if (!id) redirectWithError('/app/capa', 'CAPA id is required.');

  const existing = await loadCapa(ctx, id);
  if (ownerId) {
    const { data: member } = await ctx.db
      .from('org_members')
      .select('user_id')
      .eq('organization_id', ctx.orgId)
      .eq('user_id', ownerId)
      .maybeSingle();
    if (!member) redirectWithError(`/app/capa/${id}`, 'Owner is not a member of this organization.');
  }

  const patch = {
    owner_id: ownerId,
    assigned_to: ownerId,
    updated_at: new Date().toISOString(),
  };
  const { error } = await ctx.db
    .from('org_capa_items')
    .update(patch)
    .eq('id', id)
    .eq('organization_id', ctx.orgId);
  if (error) redirectWithError(`/app/capa/${id}`, error.message);

  await writeCapaEvent(ctx, id, 'CAPA_ASSIGNED', {
    beforeState: { owner_id: existing.owner_id ?? existing.assigned_to ?? null },
    afterState: { owner_id: ownerId },
    comment: 'capa_owner_assignment',
  });

  revalidateCapa(id);
  redirect(`/app/capa/${id}`);
}

export async function updateCapaStatus(formData: FormData) {
  const ctx = await getCapaActionContext();
  const id = asString(formData, 'id');
  const status = asString(formData, 'status');
  if (!id || !isCapaStatus(status)) {
    redirectWithError('/app/capa', 'Invalid CAPA status.');
  }

  const existing = await loadCapa(ctx, id);
  if (existing.status === status) redirect(`/app/capa/${id}`);

  const allowed = TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    redirectWithError(
      `/app/capa/${id}`,
      `Cannot move CAPA from ${CAPA_STATUS_LABELS[existing.status]} to ${CAPA_STATUS_LABELS[status]}.`,
    );
  }

  const now = new Date().toISOString();
  const patch: Record<string, string | null> = {
    status,
    updated_at: now,
  };
  if (status === 'closed') patch.closed_at = now;
  if (status === 'archived') patch.archived_at = now;

  const { error } = await ctx.db
    .from('org_capa_items')
    .update(patch)
    .eq('id', id)
    .eq('organization_id', ctx.orgId);
  if (error) redirectWithError(`/app/capa/${id}`, error.message);

  await writeCapaEvent(ctx, id, 'CAPA_STATUS_CHANGED', {
    beforeState: { status: existing.status },
    afterState: { status },
    comment: 'capa_lifecycle_transition',
  });

  revalidateCapa(id);
  redirect(`/app/capa/${id}`);
}

async function updateNarrativeField(
  formData: FormData,
  field: 'root_cause' | 'corrective_action' | 'preventive_action',
  eventType: string,
) {
  const ctx = await getCapaActionContext();
  const id = asString(formData, 'id');
  const value = asString(formData, field);
  if (!id) redirectWithError('/app/capa', 'CAPA id is required.');
  if (!value) redirectWithError(`/app/capa/${id}`, 'A narrative value is required.');

  const existing = await loadCapa(ctx, id);
  const patch = {
    [field]: value,
    updated_at: new Date().toISOString(),
  };
  const { error } = await ctx.db
    .from('org_capa_items')
    .update(patch)
    .eq('id', id)
    .eq('organization_id', ctx.orgId);
  if (error) redirectWithError(`/app/capa/${id}`, error.message);

  await writeCapaEvent(ctx, id, eventType, {
    beforeState: { [field]: existing[field] ?? null },
    afterState: { [field]: value },
    comment: `capa_${field}_form`,
  });

  revalidateCapa(id);
  redirect(`/app/capa/${id}`);
}

export async function addRootCause(formData: FormData) {
  await updateNarrativeField(formData, 'root_cause', 'CAPA_ROOT_CAUSE_ADDED');
}

export async function addCorrectiveAction(formData: FormData) {
  await updateNarrativeField(
    formData,
    'corrective_action',
    'CAPA_CORRECTIVE_ACTION_ADDED',
  );
}

export async function addPreventiveAction(formData: FormData) {
  await updateNarrativeField(
    formData,
    'preventive_action',
    'CAPA_PREVENTIVE_ACTION_ADDED',
  );
}

export async function verifyCapa(formData: FormData) {
  const ctx = await getCapaActionContext();
  const id = asString(formData, 'id');
  const notes = asString(formData, 'verification_notes');
  if (!id) redirectWithError('/app/capa', 'CAPA id is required.');
  if (!notes) redirectWithError(`/app/capa/${id}`, 'Verification notes are required.');

  const existing = await loadCapa(ctx, id);
  if (existing.status !== 'verification') {
    redirectWithError(`/app/capa/${id}`, 'CAPA must be in verification before verification can be completed.');
  }

  const now = new Date().toISOString();
  const patch = {
    verification_notes: notes,
    verification_method: notes,
    verified_by: ctx.userId,
    verified_at: now,
    updated_at: now,
  };
  const { error } = await ctx.db
    .from('org_capa_items')
    .update(patch)
    .eq('id', id)
    .eq('organization_id', ctx.orgId);
  if (error) redirectWithError(`/app/capa/${id}`, error.message);

  await writeCapaEvent(ctx, id, 'CAPA_VERIFICATION_COMPLETED', {
    beforeState: { verification_notes: existing.verification_notes ?? null },
    afterState: { verification_notes: notes, verified_by: ctx.userId },
    comment: 'capa_verification_form',
  });

  revalidateCapa(id);
  redirect(`/app/capa/${id}`);
}

export async function closeCapa(formData: FormData) {
  const ctx = await getCapaActionContext();
  const id = asString(formData, 'id');
  if (!id) redirectWithError('/app/capa', 'CAPA id is required.');

  const existing = await loadCapa(ctx, id);
  if (existing.status !== 'verification') {
    redirectWithError(`/app/capa/${id}`, 'Only CAPAs in verification can be closed.');
  }
  if (!existing.verification_notes) {
    redirectWithError(`/app/capa/${id}`, 'Complete verification before closing this CAPA.');
  }

  const now = new Date().toISOString();
  const patch = {
    status: 'closed',
    closed_at: now,
    updated_at: now,
  };
  const { error } = await ctx.db
    .from('org_capa_items')
    .update(patch)
    .eq('id', id)
    .eq('organization_id', ctx.orgId);
  if (error) redirectWithError(`/app/capa/${id}`, error.message);

  await writeCapaEvent(ctx, id, 'CAPA_CLOSED', {
    beforeState: { status: existing.status },
    afterState: { status: 'closed', closed_at: now },
    comment: 'capa_close_form',
  });

  revalidateCapa(id);
  redirect(`/app/capa/${id}`);
}

export async function archiveCapa(formData: FormData) {
  const form = new FormData();
  form.set('id', asString(formData, 'id'));
  form.set('status', 'archived');
  await updateCapaStatus(form);
}
