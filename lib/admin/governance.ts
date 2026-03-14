import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  type PlatformAdminPermission,
  type PlatformAdminRole,
  resolvePlatformAdminPermissions,
} from '@/lib/admin/rbac';

export type PlatformAdminAssignment = {
  id: string;
  user_id: string;
  email: string | null;
  role_key: PlatformAdminRole;
  permissions: PlatformAdminPermission[];
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  reason: string;
  created_at: string;
  updated_at: string;
};

export type PlatformChangeApproval = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  requested_for_user_id: string;
  requested_by: string | null;
  approver_user_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'consumed';
  reason: string;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  consumed_at: string | null;
  created_at: string;
  updated_at: string;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeAssignment(row: Record<string, unknown>): PlatformAdminAssignment {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    email: typeof row.email === 'string' ? row.email : null,
    role_key: row.role_key as PlatformAdminRole,
    permissions: resolvePlatformAdminPermissions({
      role: row.role_key as PlatformAdminRole,
      customPermissions: row.permissions,
    }),
    is_active: row.is_active !== false,
    created_by: typeof row.created_by === 'string' ? row.created_by : null,
    updated_by: typeof row.updated_by === 'string' ? row.updated_by : null,
    reason: typeof row.reason === 'string' ? row.reason : '',
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeApproval(row: Record<string, unknown>): PlatformChangeApproval {
  return {
    id: String(row.id),
    action: String(row.action),
    target_type: String(row.target_type),
    target_id: typeof row.target_id === 'string' ? row.target_id : null,
    requested_for_user_id: String(row.requested_for_user_id),
    requested_by: typeof row.requested_by === 'string' ? row.requested_by : null,
    approver_user_id:
      typeof row.approver_user_id === 'string' ? row.approver_user_id : null,
    status: row.status as PlatformChangeApproval['status'],
    reason: typeof row.reason === 'string' ? row.reason : '',
    metadata: asObject(row.metadata),
    expires_at: typeof row.expires_at === 'string' ? row.expires_at : null,
    approved_at: typeof row.approved_at === 'string' ? row.approved_at : null,
    rejected_at: typeof row.rejected_at === 'string' ? row.rejected_at : null,
    consumed_at: typeof row.consumed_at === 'string' ? row.consumed_at : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getPlatformAdminAssignment(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('platform_admin_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeAssignment(data as Record<string, unknown>);
}

export async function listPlatformAdminAssignments() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('platform_admin_assignments')
    .select('*')
    .order('updated_at', { ascending: false });

  return (data ?? []).map((row: Record<string, unknown>) =>
    normalizeAssignment(row as Record<string, unknown>),
  );
}

export async function upsertPlatformAdminAssignment(args: {
  actorUserId: string;
  userId: string;
  email?: string | null;
  roleKey: PlatformAdminRole;
  customPermissions?: PlatformAdminPermission[];
  reason: string;
  isActive?: boolean;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('platform_admin_assignments')
    .upsert(
      {
        user_id: args.userId,
        email: args.email ?? null,
        role_key: args.roleKey,
        permissions: args.customPermissions ?? [],
        is_active: args.isActive !== false,
        reason: args.reason,
        created_by: args.actorUserId,
        updated_by: args.actorUserId,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      },
    )
    .select('*')
    .single();

  if (error) throw error;
  return normalizeAssignment(data as Record<string, unknown>);
}

export async function listPlatformChangeApprovals() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('platform_change_approvals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((row: Record<string, unknown>) =>
    normalizeApproval(row as Record<string, unknown>),
  );
}

export async function createPlatformChangeApproval(args: {
  actorUserId: string;
  requestedForUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  reason: string;
  status?: PlatformChangeApproval['status'];
  metadata?: Record<string, unknown>;
  expiresAt?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const status = args.status ?? 'approved';
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from('platform_change_approvals')
    .insert({
      action: args.action,
      target_type: args.targetType,
      target_id: args.targetId ?? null,
      requested_for_user_id: args.requestedForUserId,
      requested_by: args.actorUserId,
      approver_user_id: status === 'approved' ? args.actorUserId : null,
      status,
      reason: args.reason,
      metadata: args.metadata ?? {},
      expires_at: args.expiresAt ?? null,
      approved_at: status === 'approved' ? nowIso : null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return normalizeApproval(data as Record<string, unknown>);
}

export async function updatePlatformChangeApprovalStatus(args: {
  actorUserId: string;
  approvalId: string;
  status: 'approved' | 'rejected' | 'expired' | 'consumed';
}) {
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: args.status,
    updated_at: nowIso,
  };

  if (args.status === 'approved') {
    patch.approver_user_id = args.actorUserId;
    patch.approved_at = nowIso;
  }
  if (args.status === 'rejected') {
    patch.approver_user_id = args.actorUserId;
    patch.rejected_at = nowIso;
  }
  if (args.status === 'consumed') {
    patch.consumed_at = nowIso;
  }

  const { data, error } = await admin
    .from('platform_change_approvals')
    .update(patch)
    .eq('id', args.approvalId)
    .select('*')
    .single();

  if (error) throw error;
  return normalizeApproval(data as Record<string, unknown>);
}

export async function consumeApprovedPlatformChange(args: {
  userId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from('platform_change_approvals')
    .select('*')
    .eq('requested_for_user_id', args.userId)
    .eq('action', args.action)
    .eq('status', 'approved')
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  const match = (data ?? [])
    .map((row: Record<string, unknown>) =>
      normalizeApproval(row as Record<string, unknown>),
    )
    .find((approval: PlatformChangeApproval) => {
      const targetTypeMatch =
        approval.target_type === '*' || approval.target_type === args.targetType;
      const targetIdMatch =
        approval.target_id === null ||
        approval.target_id === '*' ||
        approval.target_id === (args.targetId ?? null);
      const notExpired =
        !approval.expires_at || new Date(approval.expires_at).getTime() > Date.now();
      return targetTypeMatch && targetIdMatch && notExpired;
    });

  if (!match) return null;

  const { data: updated, error } = await admin
    .from('platform_change_approvals')
    .update({
      status: 'consumed',
      consumed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', match.id)
    .select('*')
    .single();

  if (error || !updated) return null;
  return normalizeApproval(updated as Record<string, unknown>);
}
