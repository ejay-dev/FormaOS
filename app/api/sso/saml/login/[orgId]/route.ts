import { NextResponse } from 'next/server';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { buildSpInitiatedLoginUrl } from '@/lib/sso/saml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const next = new URL(request.url).searchParams.get('next') ?? '/app';
  const config = await getOrgSsoConfig(orgId);

  if (!config?.enabled) {
    return NextResponse.json({ error: 'SSO not enabled' }, { status: 404 });
  }

  try {
    const redirectUrl = await buildSpInitiatedLoginUrl({
      orgId,
      ssoConfig: config,
      relayState: next.startsWith('/') ? next : '/app',
      host: request.headers.get('host') ?? undefined,
    });
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'SSO initiation failed' },
      { status: 500 },
    );
  }
}
