import { NextResponse } from 'next/server';
import {
  authenticateScimRequest,
  patchGroup,
  deleteGroup,
} from '@/lib/scim/scim-server';

export const runtime = 'nodejs';

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

const SCIM_HEADERS = { 'Content-Type': 'application/scim+json' };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
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
  const result = await patchGroup(orgId, groupId, body, getBaseUrl(request));

  if ('error' in result) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: SCIM_HEADERS,
    });
  }

  return NextResponse.json(result.group, { headers: SCIM_HEADERS });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
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

  const result = await deleteGroup(orgId, groupId);
  if ('error' in result) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: SCIM_HEADERS,
    });
  }

  return new NextResponse(null, { status: 204 });
}
