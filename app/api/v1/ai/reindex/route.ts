import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireEntitlement } from '@/lib/billing/entitlements';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { resolveActiveMembership } from '@/lib/auth/membership-cache';

const log = routeLog('/api/v1/ai/reindex');

export async function POST(request: NextRequest) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/app/settings/ai';
  redirectUrl.search = '';

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirectUrl.searchParams.set('error', 'auth');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Audit 2026-05-26: strict active-org resolution. This route
    // redirects on failure (form-submit UX), so we map the resolver
    // states back to redirect error params instead of using the
    // NextResponse-returning helper.
    const membership = await resolveActiveMembership(supabase);
    if (membership.kind === 'unauthorized') {
      redirectUrl.searchParams.set('error', 'auth');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    if (membership.kind === 'none') {
      redirectUrl.searchParams.set('error', 'membership');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    if (membership.kind === 'ambiguous') {
      redirectUrl.searchParams.set('error', 'active_org_required');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    const { organizationId: orgId, role } = membership;

    if (!['owner', 'admin'].includes(String(role ?? ''))) {
      redirectUrl.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    try {
      await requireEntitlement(orgId, 'ai_assistant');
    } catch {
      redirectUrl.searchParams.set('error', 'entitlement');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const admin = createSupabaseAdminClient();
    const { fullReindex } = await import('@/lib/ai/indexing-pipeline');
    const result = await fullReindex(admin, orgId);

    redirectUrl.searchParams.set('reindexed', String(result.indexed));
    redirectUrl.searchParams.set('reindexErrors', String(result.errors));
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    log.error({ err: error }, 'ai reindex failed');
    redirectUrl.searchParams.set('error', 'reindex_failed');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
