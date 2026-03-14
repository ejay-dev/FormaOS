import { NextResponse } from 'next/server';
import {
  deleteGroup,
  getGroup,
  getScimContentHeaders,
  updateGroup,
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
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
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

  const group = await getGroup(orgId, groupId, getBaseUrl(request));
  if (!group) {
    return NextResponse.json(scimError(404, 'Group not found'), {
      status: 404,
      headers: getScimContentHeaders(auth.context.headers),
    });
  }

  return NextResponse.json(group, {
    headers: getScimContentHeaders({
      ...auth.context.headers,
      ETag: group.meta.version,
    }),
  });
}

async function handleMutation(
  request: Request,
  groupId: string,
  eventType: 'scim.group.update' | 'scim.group.delete',
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
  const body = eventType === 'scim.group.delete' ? null : ((await request.json()) as Record<string, unknown>);
  const result =
    eventType === 'scim.group.delete'
      ? await deleteGroup(orgId, groupId, getBaseUrl(request), ifMatch)
      : await updateGroup(orgId, groupId, body ?? {}, getBaseUrl(request), ifMatch);

  await auditScimOperation({
    orgId,
    tokenLabel: auth.context.tokenLabel,
    eventType,
    result: result.error ? 'failure' : 'success',
    metadata: {
      group_id: groupId,
      error: result.error?.detail,
    },
    request,
  });

  if (result.error) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: getScimContentHeaders(auth.context.headers),
    });
  }

  if (eventType === 'scim.group.delete') {
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
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  return handleMutation(request, groupId, 'scim.group.update');
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  return handleMutation(request, groupId, 'scim.group.update');
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  return handleMutation(request, groupId, 'scim.group.delete');
}
