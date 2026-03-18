import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { getActorId } from '@/lib/api/v1-helpers';
import { logActivity } from '@/lib/audit-trail';
import { queueWebhookDelivery } from '@/lib/webhooks/delivery-queue';
import { dispatchIntegrationEvent } from '@/lib/integrations/manager';

type RouteContext = { params: Promise<{ memberId: string }> };

const VALID_ROLES = new Set(['owner', 'admin', 'member', 'viewer']);

export const runtime = 'nodejs';

async function findMemberRecord(orgId: string, memberId: string, db: any) {
  const member = await db
    .from('org_members')
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', memberId)
    .maybeSingle();

  if (member.data) {
    return { kind: 'member' as const, record: member.data };
  }

  const invite = await db
    .from('team_invitations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', memberId)
    .maybeSingle();

  if (invite.data) {
    return { kind: 'invitation' as const, record: invite.data };
  }

  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['members:read'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { memberId } = await context.params;
  const target = await findMemberRecord(auth.context.orgId, memberId, auth.context.db);
  if (!target) {
    const response = jsonWithContext(auth.context, { error: 'Member not found' }, { status: 404 });
    await logV1Access(auth.context, 404, 'members:read');
    return response;
  }

  await logV1Access(auth.context, 200, 'members:read');
  return jsonWithContext(auth.context, createEnvelope(target));
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['members:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { memberId } = await context.params;
  const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
  const role = typeof body?.role === 'string' ? body.role.trim().toLowerCase() : '';

  if (!VALID_ROLES.has(role)) {
    const response = jsonWithContext(auth.context, { error: 'Invalid role' }, { status: 400 });
    await logV1Access(auth.context, 400, 'members:write');
    return response;
  }

  const target = await findMemberRecord(auth.context.orgId, memberId, auth.context.db);
  if (!target) {
    const response = jsonWithContext(auth.context, { error: 'Member not found' }, { status: 404 });
    await logV1Access(auth.context, 404, 'members:write');
    return response;
  }

  const actorId = getActorId(auth.context);
  const table = target.kind === 'member' ? 'org_members' : 'team_invitations';
  const { data, error } = await auth.context.db
    .from(table)
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('organization_id', auth.context.orgId)
    .select('*')
    .single();

  if (error || !data) {
    const response = jsonWithContext(auth.context, { error: 'Failed to update member' }, { status: 500 });
    await logV1Access(auth.context, 500, 'members:write');
    return response;
  }

  await logActivity(auth.context.orgId, actorId, 'update', 'member', {
    entityId: memberId,
    details: { role, kind: target.kind },
  });

  await queueWebhookDelivery(
    auth.context.orgId,
    'member.role_changed',
    {
      id: memberId,
      role,
      kind: target.kind,
    },
    { source: 'api.v1.members.detail' },
  ).catch(() => null);

  await logV1Access(auth.context, 200, 'members:write');
  return jsonWithContext(auth.context, createEnvelope({ kind: target.kind, record: data }));
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['members:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { memberId } = await context.params;
  const target = await findMemberRecord(auth.context.orgId, memberId, auth.context.db);
  if (!target) {
    const response = jsonWithContext(auth.context, { error: 'Member not found' }, { status: 404 });
    await logV1Access(auth.context, 404, 'members:write');
    return response;
  }

  const actorId = getActorId(auth.context);
  if (target.kind === 'member') {
    await auth.context.db
      .from('org_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', auth.context.orgId);
  } else {
    await auth.context.db
      .from('team_invitations')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('organization_id', auth.context.orgId);
  }

  await logActivity(auth.context.orgId, actorId, 'delete', 'member', {
    entityId: memberId,
    details: { kind: target.kind },
  });

  await Promise.allSettled([
    queueWebhookDelivery(
      auth.context.orgId,
      'member.removed',
      {
        id: memberId,
        role: (target.record as Record<string, unknown>).role ?? null,
        kind: target.kind,
      },
      { source: 'api.v1.members.detail' },
    ),
    dispatchIntegrationEvent(auth.context.orgId, 'member.removed', {
      member: {
        id: memberId,
        removed: true,
        role: (target.record as Record<string, unknown>).role ?? null,
      },
    }),
  ]);

  await logV1Access(auth.context, 200, 'members:write');
  return jsonWithContext(auth.context, createEnvelope({ ok: true }));
}
