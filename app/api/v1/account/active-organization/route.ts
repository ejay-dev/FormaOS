import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/v1/account/active-organization');

const PostSchema = z.object({
  organizationId: z.string().uuid(),
});

/**
 * GET /api/v1/account/active-organization
 * Returns the user's current active organization preference and the
 * full list of memberships available for switching.
 */
export async function GET(request: Request) {
  const rate = await rateLimitApi(request);
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: memberships }, { data: preference }] = await Promise.all([
    supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id),
    supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const memberRows = (memberships ?? []) as Array<{
    organization_id: string;
    role: string | null;
  }>;
  const currentId =
    (preference as { current_organization_id?: string } | null)
      ?.current_organization_id ?? null;

  return NextResponse.json({
    current: memberRows.some((m) => m.organization_id === currentId)
      ? currentId
      : memberRows.length === 1
        ? memberRows[0].organization_id
        : null,
    memberships: memberRows.map((m) => ({
      organizationId: m.organization_id,
      role: m.role,
    })),
  });
}

/**
 * POST /api/v1/account/active-organization
 * Sets the user's active organization preference. The server verifies
 * membership before persisting — passing an org the user does not
 * belong to returns 403.
 *
 * This endpoint is the recovery path for the 409 `active_org_required`
 * response surfaced by `requireActiveOrgContext` on multi-org users.
 */
export async function POST(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_payload', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { organizationId } = parsed.data;

    // Verify the user is actually a member of the requested org.
    // Session client + RLS would also catch this, but explicit is
    // better for a security-shaped endpoint.
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'not_a_member', organizationId },
        { status: 403 },
      );
    }

    // Persist via admin so we don't depend on a write policy existing
    // on user_preferences for the session client. The admin client is
    // already tenant-safe here because we just validated membership.
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('user_preferences').upsert(
      {
        user_id: user.id,
        current_organization_id: organizationId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      log.error({ err: error }, 'failed to persist active organization');
      return NextResponse.json(
        { error: 'persistence_failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, organizationId });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
