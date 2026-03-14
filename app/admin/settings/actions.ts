'use server';

import { revalidatePath } from 'next/cache';
import { requireFounderAccess } from '@/app/app/admin/access';
import {
  createPlatformChangeApproval,
  updatePlatformChangeApprovalStatus,
  upsertPlatformAdminAssignment,
} from '@/lib/admin/governance';
import {
  isPlatformAdminPermission,
  type PlatformAdminPermission,
  type PlatformAdminRole,
} from '@/lib/admin/rbac';
import { logAdminAction } from '@/lib/admin/audit';

function parsePermissions(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return [] as PlatformAdminPermission[];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(isPlatformAdminPermission);
}

function readRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

export async function upsertPlatformAdminAssignmentAction(formData: FormData) {
  const { user } = await requireFounderAccess();
  const userId = readRequiredString(formData, 'userId');
  const roleKey = readRequiredString(formData, 'roleKey') as PlatformAdminRole;
  const reason = readRequiredString(formData, 'reason');
  const email = String(formData.get('email') ?? '').trim() || null;
  const customPermissions = parsePermissions(formData.get('customPermissions'));
  const isActiveValue = formData.get('isActive');
  const isActive =
    isActiveValue === 'false'
      ? false
      : isActiveValue === null
        ? false
        : String(isActiveValue).toLowerCase() !== 'false';

  const assignment = await upsertPlatformAdminAssignment({
    actorUserId: user.id,
    userId,
    email,
    roleKey,
    customPermissions,
    reason,
    isActive,
  });

  await logAdminAction({
    actorUserId: user.id,
    action: 'platform_admin_assignment_updated',
    targetType: 'platform_admin_assignment',
    targetId: assignment.id,
    metadata: {
      subject_user_id: userId,
      role_key: roleKey,
      is_active: isActive,
      custom_permissions: customPermissions,
      reason,
    },
  });

  revalidatePath('/admin/settings');
}

export async function createPlatformApprovalAction(formData: FormData) {
  const { user } = await requireFounderAccess();
  const requestedForUserId = readRequiredString(formData, 'requestedForUserId');
  const action = readRequiredString(formData, 'action');
  const targetType = readRequiredString(formData, 'targetType');
  const reason = readRequiredString(formData, 'reason');
  const targetId = String(formData.get('targetId') ?? '').trim() || null;
  const expiresInHours = Number(formData.get('expiresInHours') ?? 24);
  const expiresAt = Number.isFinite(expiresInHours)
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    : null;

  const approval = await createPlatformChangeApproval({
    actorUserId: user.id,
    requestedForUserId,
    action,
    targetType,
    targetId,
    reason,
    status: 'approved',
    expiresAt,
  });

  await logAdminAction({
    actorUserId: user.id,
    action: 'platform_change_approval_created',
    targetType: 'platform_change_approval',
    targetId: approval.id,
    metadata: {
      requested_for_user_id: requestedForUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      expires_at: expiresAt,
      reason,
    },
  });

  revalidatePath('/admin/settings');
}

export async function reviewPlatformApprovalAction(formData: FormData) {
  const { user } = await requireFounderAccess();
  const approvalId = readRequiredString(formData, 'approvalId');
  const status = readRequiredString(formData, 'status') as
    | 'approved'
    | 'rejected';

  const approval = await updatePlatformChangeApprovalStatus({
    actorUserId: user.id,
    approvalId,
    status,
  });

  await logAdminAction({
    actorUserId: user.id,
    action: 'platform_change_approval_reviewed',
    targetType: 'platform_change_approval',
    targetId: approval.id,
    metadata: {
      status,
      action: approval.action,
      target_type: approval.target_type,
      target_id: approval.target_id,
      requested_for_user_id: approval.requested_for_user_id,
    },
  });

  revalidatePath('/admin/settings');
}
