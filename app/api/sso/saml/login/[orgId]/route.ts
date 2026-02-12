import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSamlClient } from '@/lib/sso/saml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/sso/saml/login/:orgId?next=/app
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const url = new URL(request.url);
  const next = url.searchParams.get('next') ?? '/app';

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('organization_sso')
    .select('enabled, idp_entity_id, sso_url, certificate')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error || !data?.enabled) {
    return NextResponse.json({ error: 'SSO not enabled' }, { status: 404 });
  }

  const { saml } = createSamlClient({
    orgId,
    idp: {
      ssoUrl: (data as any).sso_url ?? null,
      certificate: (data as any).certificate ?? null,
      idpEntityId: (data as any).idp_entity_id ?? null,
    },
  });

  // RelayState is returned back to ACS (IdP must be configured to preserve it).
  const relayState = next.startsWith('/') ? next : '/app';
  const host = request.headers.get('host') ?? undefined;

  try {
    const authorizeUrl = await saml.getAuthorizeUrlAsync(relayState, host, {});
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    console.error('[saml/login] failed:', err);
    return NextResponse.json({ error: 'SSO initiation failed' }, { status: 500 });
  }
}

