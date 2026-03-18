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

type Params = {
  params: Promise<{ orgId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const access = await requireAdminAccess({ permission: 'billing:manage' });
    const { orgId } = await params;
    const { payload } = await parseAdminMutationPayload(request);
    const featureKey = String(payload.featureKey ?? '').trim();
    const enabled = Boolean(payload.enabled);
    const limitRaw = Number(payload.limitValue);
    const limitValue = Number.isFinite(limitRaw) ? limitRaw : null;

    if (!featureKey) {
      return NextResponse.json(
        { error: 'featureKey is required' },
        { status: 400 },
      );
    }

    const reason = await requireAdminChangeControl({
      context: access,
      action: 'org_entitlement_override',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(payload, request),
    });

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('org_entitlements').upsert(
      {
        organization_id: orgId,
        feature_key: featureKey,
        enabled,
        limit_value: limitValue,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'organization_id,feature_key',
        ignoreDuplicates: false,
      },
    );

    if (error) throw error;

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'org_entitlement_override',
      targetType: 'organization',
      targetId: orgId,
      metadata: { featureKey, enabled, limitValue, reason },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/entitlements');
  }
}
