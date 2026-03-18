import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { createApiKey, listApiKeys } from '@/lib/api-keys/manager';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['webhooks:manage'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const keys = await listApiKeys(auth.context.orgId);
  const payload = createEnvelope(
    keys.map((key) => ({
      id: key.id,
      org_id: key.org_id,
      name: key.name,
      prefix: key.prefix,
      scopes: key.scopes,
      rate_limit: key.rate_limit,
      last_used: key.last_used,
      created_by: key.created_by,
      created_at: key.created_at,
      revoked_at: key.revoked_at,
    })),
    { total: keys.length },
  );

  await logV1Access(auth.context, 200, 'webhooks:manage');
  return jsonWithContext(auth.context, payload);
}

export async function POST(request: Request) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['webhooks:manage'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; scopes?: unknown; rate_limit?: unknown }
    | null;

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const scopes = Array.isArray(body?.scopes)
    ? body!.scopes.filter((value): value is string => typeof value === 'string')
    : [];
  const rateLimit =
    typeof body?.rate_limit === 'number' && Number.isFinite(body.rate_limit)
      ? Math.max(30, Math.min(10_000, Math.round(body.rate_limit)))
      : undefined;

  if (!name) {
    const response = jsonWithContext(auth.context, { error: 'name is required' }, { status: 400 });
    await logV1Access(auth.context, 400, 'webhooks:manage');
    return response;
  }

  const created = await createApiKey({
    orgId: auth.context.orgId,
    name,
    scopes,
    rateLimit,
    createdBy: auth.context.userId!,
  });

  await logV1Access(auth.context, 201, 'webhooks:manage');
  return jsonWithContext(
    auth.context,
    createEnvelope({
      apiKey: {
        id: created.apiKey.id,
        name: created.apiKey.name,
        prefix: created.apiKey.prefix,
        scopes: created.apiKey.scopes,
        rate_limit: created.apiKey.rate_limit,
        created_at: created.apiKey.created_at,
      },
      key: created.plaintextKey,
    }),
    { status: 201 },
  );
}

