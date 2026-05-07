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

    // Bounded concurrency. Sequentially looping through up to 250 visits
    // (each iteration is 2-3 Supabase round trips) was the dominant latency
    // cost on this route. Eight in flight at a time keeps total wall-time
    // tractable without saturating the pool. The unique index on
    // (org_id, visit_id) added by 20260622_001_dedup_indexes.sql is the
    // backstop against any "two concurrent generations both pass the dedupe
    // check" race.
    const CONCURRENCY = 8;
    let generated = 0;
    let failed = 0;
    for (let i = 0; i < pendingVisits.length; i += CONCURRENCY) {
      const chunk = pendingVisits.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map((visit) => generateLineItems(admin, orgId, visit.id)),
      );
      for (let j = 0; j < results.length; j += 1) {
        const result = results[j];
        if (result.status === 'fulfilled') {
          generated += 1;
        } else {
          failed += 1;
          log.warn(
            { err: result.reason, orgId, visitId: chunk[j]?.id },
            'ndis line item generation failed',
          );
        }
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
