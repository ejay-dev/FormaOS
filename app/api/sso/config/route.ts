import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import { getOrgSsoConfig, upsertOrgSsoConfig } from '@/lib/sso/org-sso';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const orgId = new URL(request.url).searchParams.get('orgId');
    const context = await requireOrgAdminContext(orgId);
    const config = await getOrgSsoConfig(context.orgId);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const context = await requireOrgAdminContext((body.orgId as string | undefined) ?? null);
    const result = await upsertOrgSsoConfig({
      orgId: context.orgId,
      enabled: Boolean(body.enabled),
      enforceSso: Boolean(body.enforceSso),
      allowedDomains: Array.isArray(body.allowedDomains)
        ? body.allowedDomains.map((value) => String(value))
        : [],
      idpMetadataXml:
        typeof body.idpMetadataXml === 'string' && body.idpMetadataXml.trim()
          ? body.idpMetadataXml
          : null,
      jitProvisioningEnabled: Boolean(body.jitProvisioningEnabled),
      jitDefaultRole:
        (body.jitDefaultRole as
          | 'owner'
          | 'admin'
          | 'member'
          | 'viewer'
          | 'auditor'
          | undefined) ?? 'member',
      directorySyncEnabled: Boolean(body.directorySyncEnabled),
      directorySyncProvider:
        (body.directorySyncProvider as 'azure-ad' | 'okta' | 'google-workspace' | null) ?? null,
      directorySyncIntervalMinutes: Number(body.directorySyncIntervalMinutes ?? 60),
      directorySyncConfig:
        body.directorySyncConfig && typeof body.directorySyncConfig === 'object'
          ? (body.directorySyncConfig as Record<string, unknown>)
          : {},
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 },
    );
  }
}
