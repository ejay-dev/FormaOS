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
  restoreOrganizationLifecycle,
  suspendOrganizationLifecycle,
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
    const requestedStatus =
      String(body?.status ?? '').trim().toLowerCase() === 'active'
        ? 'active'
        : 'suspended';

    const reason = await requireAdminChangeControl({
      context: access,
      action: requestedStatus === 'suspended' ? 'org_suspend' : 'org_restore',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
      requireApproval: requestedStatus === 'suspended',
    });

    const admin = createSupabaseAdminClient();
    if (requestedStatus === 'suspended') {
      await suspendOrganizationLifecycle({
        admin,
        orgId,
        actorUserId: access.user.id,
        reason,
      });
    } else {
      await restoreOrganizationLifecycle({
        admin,
        orgId,
        actorUserId: access.user.id,
        reason,
      });
    }

    await logAdminAction({
      actorUserId: access.user.id,
      action: requestedStatus === 'suspended' ? 'org_suspend' : 'org_restore',
      targetType: 'organization',
      targetId: orgId,
      metadata: {
        lifecycle_status: requestedStatus,
        reason,
      },
    });

    return NextResponse.json({ ok: true, lifecycle_status: requestedStatus });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/lifecycle');
  }
}
