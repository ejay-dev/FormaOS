import { NextResponse } from 'next/server';
import {
  deleteUser,
  getScimContentHeaders,
  getUser,
  updateUser,
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const user = await getUser(orgId, id, getBaseUrl(request));
    if (!user) {
      return NextResponse.json(scimError(404, 'User not found'), {
        status: 404,
        headers: getScimContentHeaders(auth.context.headers),
      });
    }

    return NextResponse.json(user, {
      headers: getScimContentHeaders({
        ...auth.context.headers,
        ETag: user.meta.version,
      }),
    });
  } catch (error) {
    console.error('[SCIM] Unhandled error:', error);
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Internal server error',
        status: '500',
      },
      { status: 500, headers: getScimContentHeaders() },
    );
  }
}

async function handleMutation(
  request: Request,
  id: string,
  method: 'scim.user.update' | 'scim.user.delete',
) {
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

  const ifMatch = request.headers.get('if-match');
  const body =
    method === 'scim.user.delete'
      ? null
      : ((await request.json()) as Record<string, unknown>);

  const result =
    method === 'scim.user.delete'
      ? await deleteUser(orgId, id, getBaseUrl(request), ifMatch)
      : await updateUser(orgId, id, body ?? {}, getBaseUrl(request), ifMatch);

  await auditScimOperation({
    orgId,
    tokenLabel: auth.context.tokenLabel,
    eventType: method,
    targetUserId: id,
    result: result.error ? 'failure' : 'success',
    metadata: result.error ? { error: result.error.detail } : undefined,
    request,
  });

  if (result.error) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: getScimContentHeaders(auth.context.headers),
    });
  }

  if (method === 'scim.user.delete') {
    return new NextResponse(null, {
      status: 204,
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return handleMutation(request, id, 'scim.user.update');
  } catch (error) {
    console.error('[SCIM] Unhandled error:', error);
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Internal server error',
        status: '500',
      },
      { status: 500, headers: getScimContentHeaders() },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return handleMutation(request, id, 'scim.user.update');
  } catch (error) {
    console.error('[SCIM] Unhandled error:', error);
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Internal server error',
        status: '500',
      },
      { status: 500, headers: getScimContentHeaders() },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return handleMutation(request, id, 'scim.user.delete');
  } catch (error) {
    console.error('[SCIM] Unhandled error:', error);
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Internal server error',
        status: '500',
      },
      { status: 500, headers: getScimContentHeaders() },
    );
  }
}
