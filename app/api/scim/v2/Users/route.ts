import { NextResponse } from 'next/server';
import {
  createUser,
  getScimContentHeaders,
  listUsers,
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

function getOrgId(request: Request) {
  return new URL(request.url).searchParams.get('orgId');
}

export async function GET(request: Request) {
  const orgId = getOrgId(request);
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

  try {
    const url = new URL(request.url);
    const payload = await listUsers(orgId, getBaseUrl(request), {
      startIndex: Number(url.searchParams.get('startIndex')) || 1,
      count: Number(url.searchParams.get('count')) || 100,
      filter: url.searchParams.get('filter'),
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
    });

    return NextResponse.json(payload, {
      headers: getScimContentHeaders(auth.context.headers),
    });
  } catch (error) {
    return NextResponse.json(
      scimError(400, error instanceof Error ? error.message : 'Invalid query'),
      {
        status: 400,
        headers: getScimContentHeaders(auth.context.headers),
      },
    );
  }
}

export async function POST(request: Request) {
  const orgId = getOrgId(request);
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
  const result = await createUser(orgId, body, getBaseUrl(request));

  await auditScimOperation({
    orgId,
    tokenLabel: auth.context.tokenLabel,
    eventType: 'scim.user.create',
    targetUserEmail:
      (body.userName as string | undefined) ??
      ((body.emails as Array<{ value?: string }> | undefined)?.[0]?.value ?? null),
    result: result.error ? 'failure' : 'success',
    metadata: result.error ? { error: result.error.detail } : { user_id: result.data?.id },
    request,
  });

  if (result.error) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: getScimContentHeaders(auth.context.headers),
    });
  }

  return NextResponse.json(result.data, {
    status: result.status,
    headers: getScimContentHeaders({
      ...auth.context.headers,
      ETag: result.data!.meta.version,
    }),
  });
}
