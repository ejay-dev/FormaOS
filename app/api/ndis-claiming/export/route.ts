import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { exportClaimFile, batchValidateClaims } from '@/lib/care/ndis-claiming';
import { resolveActiveMembership } from '@/lib/auth/membership-cache';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/ndis-claiming/export');

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url), {
        status: 303,
      });
    }

    // Claim-file generation is an expensive export; rate-limit it.
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    // Resolve the user's ACTIVE org (not an arbitrary .maybeSingle() pick).
    // A multi-org user with no active selection must disambiguate before we
    // generate a claim file — exporting the wrong tenant's NDIS claims is a
    // serious data/billing error.
    const membership = await resolveActiveMembership(supabase);
    if (membership.kind !== 'ok') {
      const reason =
        membership.kind === 'ambiguous' ? 'active_org' : 'membership';
      return NextResponse.redirect(
        new URL(`/app/ndis-claiming?error=${reason}`, request.url),
        { status: 303 },
      );
    }

    const admin = createSupabaseAdminClient();
    const orgId = membership.organizationId;
    const [{ data: org }, { data: items }] = await Promise.all([
      admin.from('organizations').select('name').eq('id', orgId).maybeSingle(),
      admin
        .from('org_ndis_line_items')
        // Only 'ready' items are exportable — drafts are not yet cleared for
        // claiming and must not reach the NDIA bulk-payment file.
        .select('id, status')
        .eq('org_id', orgId)
        .in('status', ['ready'])
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    const lineItemIds = (items ?? []).map((item) => item.id).filter(Boolean);
    if (lineItemIds.length === 0) {
      return NextResponse.redirect(
        new URL('/app/ndis-claiming?error=no_claims', request.url),
        {
          status: 303,
        },
      );
    }

    // Hard validation gate: every line item must pass batchValidateClaims
    // (price ceiling, positive quantity/total, total = unit × qty) before
    // we generate a claim file for government billing. Refuse the whole
    // export if any item fails — a partial/invalid claim file is worse than
    // none.
    const validations = await batchValidateClaims(admin, orgId, lineItemIds);
    const invalid = validations.filter((v) => !v.valid);
    if (invalid.length > 0) {
      log.warn(
        { orgId, invalidCount: invalid.length, sample: invalid.slice(0, 5) },
        'ndis export blocked: line items failed validation',
      );
      return NextResponse.redirect(
        new URL(
          `/app/ndis-claiming?error=validation_failed&invalid=${invalid.length}`,
          request.url,
        ),
        { status: 303 },
      );
    }

    const csv = await exportClaimFile(admin, orgId, lineItemIds);
    const filename = `${sanitizeSegment(org?.name ?? 'FormaOS') || 'FormaOS'}-NDIS-Claim-File-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    log.error({ err: error }, 'ndis export failed');
    return NextResponse.redirect(
      new URL('/app/ndis-claiming?error=export_failed', request.url),
      {
        status: 303,
      },
    );
  }
}
