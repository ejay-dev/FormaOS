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
  retireOrganizationLifecycle,
  restoreOrganizationLifecycle,
  suspendOrganizationLifecycle,
} from '@/lib/admin/org-lifecycle';

type Params = {
  params: Promise<{ orgId: string }>;
};

const LIFECYCLE_ACTION_CONFIG = {
  active: {
    action: 'org_restore',
    requireApproval: false,
  },
  suspended: {
    action: 'org_suspend',
    requireApproval: true,
  },
  retired: {
    action: 'org_retire',
    requireApproval: true,
  },
} as const;

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
    const requestedStatus = String(body?.status ?? '').trim().toLowerCase();

    if (!(requestedStatus in LIFECYCLE_ACTION_CONFIG)) {
      return NextResponse.json(
        { error: 'status_must_be_active_suspended_or_retired' },
        { status: 400 },
      );
    }

    const lifecycleAction =
      LIFECYCLE_ACTION_CONFIG[
        requestedStatus as keyof typeof LIFECYCLE_ACTION_CONFIG
      ];

    const reason = await requireAdminChangeControl({
      context: access,
      action: lifecycleAction.action,
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
      requireApproval: lifecycleAction.requireApproval,
    });

    const admin = createSupabaseAdminClient();
    if (requestedStatus === 'suspended') {
      await suspendOrganizationLifecycle({
        admin,
        orgId,
        actorUserId: access.user.id,
        reason,
      });
    } else if (requestedStatus === 'retired') {
      await retireOrganizationLifecycle({
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
      action: lifecycleAction.action,
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
