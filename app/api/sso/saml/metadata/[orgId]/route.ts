import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSamlClient } from '@/lib/sso/saml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('organization_sso')
    .select('enabled, idp_entity_id, sso_url, certificate')
    .eq('organization_id', orgId)
    .maybeSingle();

  // Metadata must be callable by IdP. If not configured, return 404.
  if (error || !data?.enabled) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { saml } = createSamlClient({
    orgId,
    idp: {
      ssoUrl: (data as any).sso_url ?? null,
      certificate: (data as any).certificate ?? null,
      idpEntityId: (data as any).idp_entity_id ?? null,
    },
  });

  const spPublicCert = (process.env.SAML_SP_PUBLIC_CERT ?? '').trim();
  const xml = saml.generateServiceProviderMetadata(null, spPublicCert || null);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/samlmetadata+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

