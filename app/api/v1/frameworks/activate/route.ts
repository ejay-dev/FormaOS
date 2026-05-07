import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { provisionFrameworkControls } from '@/lib/frameworks/provisioning';
import { validateCsrfOrigin } from '@/lib/security/csrf';

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId)
      return NextResponse.json({ error: 'No organization' }, { status: 400 });

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
