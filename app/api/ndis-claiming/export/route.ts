import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { exportClaimFile } from '@/lib/care/ndis-claiming';
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
      return NextResponse.redirect(new URL('/signin', request.url), {
        status: 303,
      });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.redirect(
        new URL('/app/ndis-claiming?error=membership', request.url),
        {
          status: 303,
        },
      );
    }

    const admin = createSupabaseAdminClient();
    const orgId = membership.organization_id;
    const [{ data: org }, { data: items }] = await Promise.all([
      admin.from('organizations').select('name').eq('id', orgId).maybeSingle(),
      admin
        .from('org_ndis_line_items')
        .select('id, status')
        .eq('org_id', orgId)
        .in('status', ['ready', 'draft'])
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
