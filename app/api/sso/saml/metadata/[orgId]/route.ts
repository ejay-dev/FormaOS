import { NextResponse } from 'next/server';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { generateSpMetadataXml } from '@/lib/sso/saml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const config = await getOrgSsoConfig(orgId);

  if (!config?.enabled) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const xml = generateSpMetadataXml({
    orgId,
    ssoConfig: config,
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/samlmetadata+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
