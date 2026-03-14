import { NextResponse } from 'next/server';
import {
  executeBulkOperations,
  getScimContentHeaders,
} from '@/lib/scim/scim-server';
import {
  auditScimOperation,
  authenticateScimRequest,
  scimError,
} from '@/lib/scim/scim-auth';

export const runtime = 'nodejs';

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(scimError(400, 'orgId query param required'), {
      status: 400,
      headers: getScimContentHeaders(),
    });
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: getScimContentHeaders(auth.headers),
    });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const result = await executeBulkOperations(orgId, getBaseUrl(request), body);

  await auditScimOperation({
    orgId,
    tokenLabel: auth.context.tokenLabel,
    eventType: 'scim.bulk',
    result: result.status >= 400 ? 'failure' : 'success',
    metadata: {
      operation_count: Array.isArray(body.Operations) ? body.Operations.length : 0,
      status: result.status,
    },
    request,
  });

  return NextResponse.json(result.body, {
    status: result.status,
    headers: getScimContentHeaders(auth.context.headers),
  });
}
