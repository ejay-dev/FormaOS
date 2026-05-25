import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { provisionFrameworkControls } from '@/lib/frameworks/provisioning';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

// Roles allowed to activate a compliance framework for the org.
// Viewer / member can browse but not provision — provisioning seeds
// controls and changes the org's posture, so it's owner/admin gated.
const FRAMEWORK_ACTIVATE_ROLES: ReadonlySet<string> = new Set([
  'owner',
  'admin',
  'compliance_admin',
]);

const log = routeLog('/api/v1/frameworks/activate');

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
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;
    const { orgId, role } = ctx;

    if (!role || !FRAMEWORK_ACTIVATE_ROLES.has(role)) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message:
            'Activating a compliance framework requires an owner or admin role.',
        },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      frameworkSlug?: string;
      industry?: string;
    };
    if (!body.frameworkSlug) {
      return NextResponse.json(
        { error: 'frameworkSlug required' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from('org_frameworks').upsert(
      {
        organization_id: orgId,
        framework_slug: body.frameworkSlug,
        enabled_at: now,
      },
      { onConflict: 'organization_id,framework_slug' },
    );

    if (error) {
      log.error(
        { err: error, slug: body.frameworkSlug },
        'failed to activate framework',
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Seed framework controls into org_control_evaluations so the compliance
    // score starts at a real baseline (0%) rather than showing no data at all.
    provisionFrameworkControls(orgId, body.frameworkSlug, {
      force: true,
    }).catch((err) => {
      log.error(
        { err, slug: body.frameworkSlug },
        'framework controls provisioning failed (non-critical)',
      );
    });

    return NextResponse.json({ ok: true, frameworkSlug: body.frameworkSlug });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
