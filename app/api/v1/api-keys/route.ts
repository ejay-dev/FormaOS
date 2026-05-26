import { z } from 'zod';
import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { createApiKey, listApiKeys } from '@/lib/api-keys/manager';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const createApiKeySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100),
  scopes: z.array(z.string().trim().min(1).max(64)).max(50).optional().default([]),
  rate_limit: z.number().int().min(30).max(10_000).optional(),
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['api_keys:manage'],
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

  await logV1Access(auth.context, 200, 'api_keys:manage');
  return jsonWithContext(auth.context, payload);
}

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['api_keys:manage'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const validation = await validateBody(request, createApiKeySchema);
  if (!validation.success) {
    const response = jsonWithContext(
      auth.context,
      formatZodError(validation.error),
      { status: 400 },
    );
    await logV1Access(auth.context, 400, 'api_keys:manage');
    return response;
  }
  const { name, scopes, rate_limit: rateLimit } = validation.data;

  const created = await createApiKey({
    orgId: auth.context.orgId,
    name,
    scopes,
    rateLimit,
    createdBy: auth.context.userId!,
  });

  await logV1Access(auth.context, 201, 'api_keys:manage');
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

