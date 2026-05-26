import { NextResponse } from 'next/server';
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
import { revokeAllSessions } from '@/lib/auth/session-revocation';

// Audit 2026-05-26 — P0-12: admin endpoint that revokes every active
// session for a target user.
//
// Sets the user's revocation watermark via revokeAllSessions; the next
// time the target user's JWT (or any of their other tabs/devices) hits
// any auth gate, assertSessionNotRevoked compares the JWT iat against
// the watermark and rejects, forcing a Supabase refresh which then
// re-reads the user's current role + membership state.
//
// Approval-gated (high-risk per ADMIN_OPERATING_POLICY.md §3) and
// requires a written reason >= 8 chars. Logged to the platform audit
// stream.

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

    const access = await requireAdminAccess({ permission: 'security:manage' });
    const { userId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);

    const reason = await requireAdminChangeControl({
      context: access,
      action: 'session_revoke',
      targetType: 'user',
      targetId: userId,
      reason: extractAdminReason(body, request),
      requireApproval: true,
    });

    const revokedAt = await revokeAllSessions(userId, {
      revokedBy: access.user.id,
      reason,
    });

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'session_revoke',
      targetType: 'user',
      targetId: userId,
      metadata: {
        reason,
        revoked_at: revokedAt.toISOString(),
      },
    });

    return NextResponse.json({ ok: true, revoked_at: revokedAt.toISOString() });
  } catch (error) {
    return handleAdminError(
      error,
      '/api/admin/users/[userId]/revoke-sessions',
    );
  }
}
