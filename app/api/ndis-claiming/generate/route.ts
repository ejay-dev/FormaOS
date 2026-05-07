import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateLineItems } from '@/lib/care/ndis-claiming';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/ndis-claiming/generate');

export async function POST(request: Request) {
  const redirectUrl = new URL('/app/ndis-claiming', request.url);

  // CSRF check before any state change
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirectUrl.searchParams.set('error', 'auth');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      redirectUrl.searchParams.set('error', 'membership');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const admin = createSupabaseAdminClient();
    const orgId = membership.organization_id;

    const [{ data: visits }, { data: existingLineItems }] = await Promise.all([
      admin
        .from('org_visits')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(250),
      admin.from('org_ndis_line_items').select('visit_id').eq('org_id', orgId),
    ]);

    const existingVisitIds = new Set(
      (existingLineItems ?? [])
        .map((item) => item.visit_id)
        .filter(
          (visitId): visitId is string =>
            typeof visitId === 'string' && visitId.length > 0,
        ),
    );

    const pendingVisits = (visits ?? []).filter(
      (visit) =>
        typeof visit.id === 'string' && !existingVisitIds.has(visit.id),
    );

    let generated = 0;
    let failed = 0;

    for (const visit of pendingVisits) {
      try {
        await generateLineItems(admin, orgId, visit.id);
        generated++;
      } catch (error) {
        failed++;
        log.warn(
          { err: error, orgId, visitId: visit.id },
          'ndis line item generation failed',
        );
      }
    }

    redirectUrl.searchParams.set('generated', String(generated));
    redirectUrl.searchParams.set('failed', String(failed));
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    log.error({ err: error }, 'ndis generation failed');
    redirectUrl.searchParams.set('error', 'generate_failed');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
