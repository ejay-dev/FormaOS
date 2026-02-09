import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  rateLimitApi,
} from '@/lib/security/rate-limiter';
import { requirePermission } from '@/app/app/actions/rbac';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import {
  uuidSchema,
  safeString,
  validateBody,
  formatZodError,
} from '@/lib/security/api-validation';
import { z } from 'zod';

const htmlSchema = z
  .string()
  .min(1)
  .max(200000)
  .refine(
    (val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val),
    'Script tags not allowed',
  );

const updatePolicySchema = z.object({
  policyId: uuidSchema,
  html: htmlSchema,
  title: safeString({ max: 200 }).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = await validateBody(req, updatePolicySchema);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const { policyId, html, title } = parsed.data;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimit = await rateLimitApi(req, user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.resetAt },
        { status: 429 },
      );
    }

    const permissionCtx = await requirePermission('EDIT_CONTROLS');

    const { data: policy, error: policyError } = await supabase
      .from('org_policies')
      .select('organization_id, title')
      .eq('id', policyId)
      .maybeSingle();

    if (policyError || !policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }
    if (policy.organization_id !== permissionCtx.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedTitle = title ?? policy.title;

    const { error } = await supabase
      .from('org_policies')
      .update({
        content: html,
        title: updatedTitle,
        last_updated_at: new Date().toISOString(),
        last_updated_by: user.id,
      })
      .eq('id', policyId)
      .eq('organization_id', policy.organization_id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    await logAuditEvent({
      organizationId: policy.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: 'policy',
      entityId: policyId,
      actionType: 'POLICY_UPDATED',
      beforeState: { title: policy.title },
      afterState: {
        title: updatedTitle,
        content_length: typeof html === 'string' ? html.length : null,
      },
      reason: 'policy_editor_update',
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Server error' },
      { status: 500 },
    );
  }
}
