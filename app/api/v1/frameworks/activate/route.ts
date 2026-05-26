import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { provisionFrameworkControls } from '@/lib/frameworks/provisioning';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const activateFrameworkSchema = z.object({
  frameworkSlug: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/, 'frameworkSlug must be lowercase alphanumeric'),
  industry: z.string().trim().max(64).optional(),
});

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

    const validation = await validateBody(request, activateFrameworkSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;

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
      return NextResponse.json(
        { error: 'Failed to activate framework' },
        { status: 500 },
      );
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
