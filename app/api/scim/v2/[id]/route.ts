import { NextResponse } from 'next/server';
import {
  authenticateScimRequest,
  getUser,
  updateUser,
  deleteUser,
} from '@/lib/scim/scim-server';

export const runtime = 'nodejs';

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

const SCIM_HEADERS = { 'Content-Type': 'application/scim+json' };

// GET /api/scim/v2/[id] — Get User by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId required',
      },
      { status: 400, headers: SCIM_HEADERS },
    );
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: SCIM_HEADERS,
    });
  }

  const user = await getUser(orgId, id, getBaseUrl(request));
  if (!user) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '404',
        detail: 'User not found',
      },
      { status: 404, headers: SCIM_HEADERS },
    );
  }

  return NextResponse.json(user, { headers: SCIM_HEADERS });
}

// PUT /api/scim/v2/[id] — Replace User
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId required',
      },
      { status: 400, headers: SCIM_HEADERS },
    );
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: SCIM_HEADERS,
    });
  }

  const body = await request.json();
  const result = await updateUser(orgId, id, body, getBaseUrl(request));

  if ('error' in result) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: SCIM_HEADERS,
    });
  }

  return NextResponse.json(result.user, { headers: SCIM_HEADERS });
}

// PATCH /api/scim/v2/[id] — Partial Update User
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId required',
      },
      { status: 400, headers: SCIM_HEADERS },
    );
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: SCIM_HEADERS,
    });
  }

  const body = await request.json();
  const result = await updateUser(orgId, id, body, getBaseUrl(request));

  if ('error' in result) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: SCIM_HEADERS,
    });
  }

  return NextResponse.json(result.user, { headers: SCIM_HEADERS });
}

// DELETE /api/scim/v2/[id] — Delete User
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId required',
      },
      { status: 400, headers: SCIM_HEADERS },
    );
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: SCIM_HEADERS,
    });
  }

  const result = await deleteUser(orgId, id);
  if ('error' in result) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: SCIM_HEADERS,
    });
  }

  return new NextResponse(null, { status: 204 });
}
