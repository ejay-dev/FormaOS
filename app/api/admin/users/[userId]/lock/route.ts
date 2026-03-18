import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
  requireAdminChangeControl,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { checkAdminRateLimit, getClientIp } from '@/lib/ratelimit';

type Params = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = await checkAdminRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const access = await requireAdminAccess({ permission: 'users:manage' });
    const { userId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);
    const locked = Boolean(body?.locked);
    const reason = await requireAdminChangeControl({
      context: access,
      action: locked ? 'user_lock' : 'user_unlock',
      targetType: 'user',
      targetId: userId,
      reason: extractAdminReason(body, request),
      requireApproval: locked,
    });

    const admin = createSupabaseAdminClient();
    const banDuration = locked ? '876000h' : 'none';
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    await logAdminAction({
      actorUserId: access.user.id,
      action: locked ? 'user_lock' : 'user_unlock',
      targetType: 'user',
      targetId: userId,
      metadata: { locked, reason },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/users/[userId]/lock');
  }
}
