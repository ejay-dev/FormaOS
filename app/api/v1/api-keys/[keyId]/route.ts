import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { revokeApiKey, rotateApiKey, updateApiKey } from '@/lib/api-keys/manager';

type RouteContext = { params: Promise<{ keyId: string }> };

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['webhooks:manage'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { keyId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; scopes?: unknown; rate_limit?: unknown; rotate?: unknown }
    | null;

  if (body?.rotate === true) {
    const rotated = await rotateApiKey({
      keyId,
      orgId: auth.context.orgId,
      rotatedBy: auth.context.userId!,
      name: typeof body.name === 'string' ? body.name : undefined,
      scopes: Array.isArray(body.scopes)
        ? body.scopes.filter((value): value is string => typeof value === 'string')
        : undefined,
      rateLimit:
        typeof body.rate_limit === 'number' ? Math.round(body.rate_limit) : undefined,
    });

    await logV1Access(auth.context, 200, 'webhooks:manage');
    return jsonWithContext(
      auth.context,
      createEnvelope({
        apiKey: {
          id: rotated.apiKey.id,
          name: rotated.apiKey.name,
          prefix: rotated.apiKey.prefix,
          scopes: rotated.apiKey.scopes,
          rate_limit: rotated.apiKey.rate_limit,
        },
        key: rotated.plaintextKey,
      }),
    );
  }

  const updated = await updateApiKey(keyId, auth.context.orgId, {
    name: typeof body?.name === 'string' ? body.name.trim() : undefined,
    scopes: Array.isArray(body?.scopes)
      ? body!.scopes.filter((value): value is string => typeof value === 'string')
      : undefined,
    rateLimit:
      typeof body?.rate_limit === 'number' ? Math.round(body.rate_limit) : undefined,
  });

  await logV1Access(auth.context, 200, 'webhooks:manage');
  return jsonWithContext(auth.context, createEnvelope({ apiKey: updated }));
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['webhooks:manage'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { keyId } = await context.params;
  await revokeApiKey({
    keyId,
    orgId: auth.context.orgId,
    revokedBy: auth.context.userId!,
  });

  await logV1Access(auth.context, 200, 'webhooks:manage');
  return jsonWithContext(auth.context, createEnvelope({ ok: true }));
}

