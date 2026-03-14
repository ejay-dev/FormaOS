import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
  requireAdminChangeControl,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { logAdminAction } from '@/lib/admin/audit';
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { notify } from '@/lib/notifications/engine';

type Params = {
  params: Promise<{ orgId: string; userId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const access = await requireAdminAccess({ permission: 'orgs:manage' });
    const { orgId, userId } = await params;
    const { payload } = await parseAdminMutationPayload(request);
    const role = String(payload.role ?? '').trim().toLowerCase();

    if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const reason = await requireAdminChangeControl({
      context: access,
      action: 'org_member_role_update',
      targetType: 'organization_member',
      targetId: `${orgId}:${userId}`,
      reason: extractAdminReason(payload, request),
    });

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('org_members')
      .update({ role })
      .eq('organization_id', orgId)
      .eq('user_id', userId);

    if (error) throw error;

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'org_member_role_update',
      targetType: 'organization_member',
      targetId: `${orgId}:${userId}`,
      metadata: { role, reason },
    });

    await logProductActivity(
      orgId,
      access.user.id,
      'updated',
      {
        type: 'member',
        id: userId,
        name: userId,
        path: `/admin/orgs/${orgId}`,
      },
      {
        role,
        reason,
      },
    );

    await notify(orgId, [userId], {
      type: 'member.role_changed',
      title: 'Role updated',
      body: `Your organization role was changed to ${role}.`,
      priority: 'normal',
      data: {
        href: '/app/settings',
        role,
        dedupeKey: `member.role_changed:${orgId}:${userId}:${role}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/members/[userId]');
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const access = await requireAdminAccess({ permission: 'orgs:manage' });
    const { orgId, userId } = await params;
    const { payload } = await parseAdminMutationPayload(request);
    const reason = await requireAdminChangeControl({
      context: access,
      action: 'org_member_remove',
      targetType: 'organization_member',
      targetId: `${orgId}:${userId}`,
      reason: extractAdminReason(payload, request),
    });

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('org_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', userId);

    if (error) throw error;

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'org_member_remove',
      targetType: 'organization_member',
      targetId: `${orgId}:${userId}`,
      metadata: { reason },
    });

    await logProductActivity(
      orgId,
      access.user.id,
      'deleted',
      {
        type: 'member',
        id: userId,
        name: userId,
        path: `/admin/orgs/${orgId}`,
      },
      {
        reason,
      },
    );

    await notify(orgId, [userId], {
      type: 'member.removed',
      title: 'Access removed',
      body: 'Your access to this organization has been removed.',
      priority: 'high',
      data: {
        href: '/auth/signin',
        dedupeKey: `member.removed:${orgId}:${userId}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/members/[userId]');
  }
}
