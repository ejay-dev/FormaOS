import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import { logIdentityEvent } from '@/lib/identity/audit';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { buildSpInitiatedLoginUrl } from '@/lib/sso/saml';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const context = await requireOrgAdminContext((body.orgId as string | undefined) ?? null);
    const config = await getOrgSsoConfig(context.orgId);
    if (!config?.enabled) {
      return NextResponse.json({ ok: false, error: 'SSO not configured' }, { status: 400 });
    }

    const redirectUrl = await buildSpInitiatedLoginUrl({
      orgId: context.orgId,
      ssoConfig: config,
      relayState: '/app/settings/security?sso_test=1',
    });

    await logIdentityEvent({
      eventType: 'sso.test',
      actorType: 'user',
      actorId: context.user.id,
      actorLabel: context.user.email ?? 'org-admin',
      orgId: context.orgId,
      result: 'success',
    });

    return NextResponse.json({ ok: true, redirectUrl });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'SSO test failed' },
      { status: 400 },
    );
  }
}
