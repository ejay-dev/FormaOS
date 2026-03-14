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
import {
  lockOrganizationAccess,
  unlockOrganizationAccess,
} from '@/lib/admin/org-lifecycle';

type Params = {
  params: Promise<{ orgId: string }>;
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

    const access = await requireAdminAccess({ permission: 'orgs:manage' });
    const { orgId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);
    const locked = Boolean(body?.locked);
    const reason = await requireAdminChangeControl({
      context: access,
      action: locked ? 'org_lock' : 'org_unlock',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
      requireApproval: locked,
    });

    const admin = createSupabaseAdminClient();
    if (locked) {
      await lockOrganizationAccess(admin, orgId);
    } else {
      await unlockOrganizationAccess(admin, orgId);
    }

    await logAdminAction({
      actorUserId: access.user.id,
      action: locked ? 'org_lock' : 'org_unlock',
      targetType: 'organization',
      targetId: orgId,
      metadata: { locked, reason },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/lock');
  }
}
