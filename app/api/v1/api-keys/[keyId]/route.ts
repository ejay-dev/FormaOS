import { z } from 'zod';
import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { revokeApiKey, rotateApiKey, updateApiKey } from '@/lib/api-keys/manager';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

type RouteContext = { params: Promise<{ keyId: string }> };

const updateApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  scopes: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
  rate_limit: z.number().int().min(30).max(10_000).optional(),
  rotate: z.boolean().optional(),
});

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: RouteContext) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['api_keys:manage'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { keyId } = await context.params;
  const validation = await validateBody(request, updateApiKeySchema);
  if (!validation.success) {
    const response = jsonWithContext(
      auth.context,
      formatZodError(validation.error),
      { status: 400 },
    );
    await logV1Access(auth.context, 400, 'api_keys:manage');
    return response;
  }
  const body = validation.data;

  if (body.rotate === true) {
    const rotated = await rotateApiKey({
      keyId,
      orgId: auth.context.orgId,
      rotatedBy: auth.context.userId!,
      name: body.name,
      scopes: body.scopes,
      rateLimit: body.rate_limit,
    });

    await logV1Access(auth.context, 200, 'api_keys:manage');
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
    name: body.name,
    scopes: body.scopes,
    rateLimit: body.rate_limit,
  });

  await logV1Access(auth.context, 200, 'api_keys:manage');
  return jsonWithContext(auth.context, createEnvelope({ apiKey: updated }));
}

export async function DELETE(request: Request, context: RouteContext) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['api_keys:manage'],
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

  await logV1Access(auth.context, 200, 'api_keys:manage');
  return jsonWithContext(auth.context, createEnvelope({ ok: true }));
}

