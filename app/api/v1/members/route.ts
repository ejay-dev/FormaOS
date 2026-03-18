import { randomUUID } from 'crypto';
import { authenticateV1Request, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { createEnvelope } from '@/lib/api-keys/middleware';
import { getActorId, createInvitationToken } from '@/lib/api/v1-helpers';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit-trail';
import { queueWebhookDelivery } from '@/lib/webhooks/delivery-queue';
import { dispatchIntegrationEvent } from '@/lib/integrations/manager';
import { sendAuthEmail } from '@/lib/email/send-auth-email';

const VALID_ROLES = new Set(['owner', 'admin', 'member', 'viewer']);
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_INVITE_BASE = 'https://app.formaos.com.au';

export const runtime = 'nodejs';

function getInviteBase() {
  const raw =
    (process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      DEFAULT_INVITE_BASE).trim();
  try {
    return new URL(raw).origin.replace(/\/$/, '');
  } catch {
    return DEFAULT_INVITE_BASE;
  }
}

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['members:read'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { limit, offset, searchParams } = getPagination(request, 25, 100);
  const role = searchParams.get('role');
  const status = searchParams.get('status');

  let memberQuery = auth.context.db
    .from('org_members')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.context.orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) {
    memberQuery = memberQuery.eq('role', role);
  }

  const { data: members, count } = await memberQuery;

  let invitations: Record<string, unknown>[] = [];
  if (!status || status === 'invited') {
    const { data } = await auth.context.db
      .from('team_invitations')
      .select('id, email, role, status, invited_by, expires_at, created_at')
      .eq('organization_id', auth.context.orgId)
      .in('status', ['pending', 'revoked'])
      .order('created_at', { ascending: false })
      .limit(limit);
    invitations = ((data ?? []) as Array<Record<string, unknown>>).map((invite) => ({
      ...invite,
      kind: 'invitation',
    }));
  }

  const data = [
    ...(((members ?? []) as Array<Record<string, unknown>>).map((member) => ({
      ...member,
      kind: 'member',
    })) as Record<string, unknown>[]),
    ...invitations,
  ].slice(0, limit);

  await logV1Access(auth.context, 200, 'members:read');
  return jsonWithContext(
    auth.context,
    paginatedEnvelope(data, { offset, limit, total: (count ?? 0) + invitations.length }),
  );
}

export async function POST(request: Request) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['members:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; role?: unknown }
    | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body?.role === 'string' ? body.role.trim().toLowerCase() : 'member';

  if (!email || !email.includes('@')) {
    const response = jsonWithContext(auth.context, { error: 'Valid email is required' }, { status: 400 });
    await logV1Access(auth.context, 400, 'members:write');
    return response;
  }

  if (!VALID_ROLES.has(role)) {
    const response = jsonWithContext(auth.context, { error: 'Invalid role' }, { status: 400 });
    await logV1Access(auth.context, 400, 'members:write');
    return response;
  }

  const admin = createSupabaseAdminClient();
  const token = createInvitationToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS).toISOString();
  const actorId = getActorId(auth.context);

  const { data: invitation, error } = await admin
    .from('team_invitations')
    .insert({
      id: randomUUID(),
      organization_id: auth.context.orgId,
      email,
      role,
      token,
      invited_by: actorId,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id, email, role, status, expires_at, created_at')
    .single();

  if (error || !invitation) {
    const response = jsonWithContext(
      auth.context,
      { error: error?.message ?? 'Failed to create invitation' },
      { status: 500 },
    );
    await logV1Access(auth.context, 500, 'members:write');
    return response;
  }

  const inviteUrl = `${getInviteBase()}/accept-invite/${token}`;
  const [{ data: organization }, sessionUserResult] = await Promise.all([
    admin
      .from('organizations')
      .select('name')
      .eq('id', auth.context.orgId)
      .maybeSingle(),
    auth.context.accessType === 'session'
      ? auth.context.supabase.auth.getUser()
      : Promise.resolve({ data: { user: null }, error: null }),
  ]);
  const invitedByName =
    sessionUserResult.data.user?.user_metadata?.full_name ||
    sessionUserResult.data.user?.user_metadata?.name ||
    sessionUserResult.data.user?.email?.split('@')[0] ||
    'a team administrator';
  const emailResult = await sendAuthEmail({
    to: email,
    template: 'invite',
    actionLink: inviteUrl,
    organizationName: organization?.name || 'your organization',
    invitedByName,
  });
  const delivery =
    emailResult.success
      ? { status: 'sent' as const, id: emailResult.id ?? null }
      : {
          status: 'manual_share_required' as const,
          error: emailResult.error ?? 'invite_delivery_failed',
        };

  await logActivity(auth.context.orgId, actorId, 'invite', 'member', {
    entityId: invitation.id,
    entityName: email,
    details: { role, type: 'team_invitation', delivery: delivery.status },
  });

  await Promise.allSettled([
    queueWebhookDelivery(
      auth.context.orgId,
      'member.added',
      {
        id: invitation.id,
        email,
        role,
        invited: true,
      },
      { source: 'api.v1.members' },
    ),
    dispatchIntegrationEvent(auth.context.orgId, 'member.added', {
      member: {
        id: invitation.id,
        email,
        role,
      },
    }),
  ]);

  await logV1Access(auth.context, 201, 'members:write');
  return jsonWithContext(
    auth.context,
    createEnvelope({
      invitation: {
        ...invitation,
        inviteUrl,
        delivery,
      },
    }),
    { status: 201 },
  );
}
