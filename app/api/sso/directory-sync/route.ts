import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import {
  getDirectorySyncStatus,
  syncDirectory,
  upsertDirectorySyncConfig,
} from '@/lib/sso/directory-sync';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const orgId = new URL(request.url).searchParams.get('orgId');
    const context = await requireOrgAdminContext(orgId);
    const status = await getDirectorySyncStatus(context.orgId);
    return NextResponse.json({ ok: true, ...status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Forbidden' },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const context = await requireOrgAdminContext((body.orgId as string | undefined) ?? null);
    const provider = body.provider as 'azure-ad' | 'okta' | 'google-workspace';
    const config =
      body.config && typeof body.config === 'object'
        ? (body.config as Record<string, unknown>)
        : {};

    await upsertDirectorySyncConfig({
      orgId: context.orgId,
      provider,
      enabled: body.enabled !== false,
      intervalMinutes: Number(body.intervalMinutes ?? 60),
      config,
    });

    const result = await syncDirectory(context.orgId, provider, config);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Directory sync failed' },
      { status: 400 },
    );
  }
}
