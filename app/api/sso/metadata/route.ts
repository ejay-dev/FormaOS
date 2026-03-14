import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import { logIdentityEvent } from '@/lib/identity/audit';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { generateSpMetadataXml } from '@/lib/sso/saml';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const orgId = new URL(request.url).searchParams.get('orgId');
    const context = await requireOrgAdminContext(orgId);
    const config = await getOrgSsoConfig(context.orgId);
    if (!config) {
      return new NextResponse('SSO not configured', { status: 404 });
    }

    const xml = generateSpMetadataXml({
      orgId: context.orgId,
      ssoConfig: config,
    });

    await logIdentityEvent({
      eventType: 'sso.metadata.generated',
      actorType: 'user',
      actorId: context.user.id,
      actorLabel: context.user.email ?? 'org-admin',
      orgId: context.orgId,
      result: 'success',
    });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/samlmetadata+xml; charset=utf-8',
      },
    });
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : 'Forbidden', {
      status: 403,
    });
  }
}
