import { NextResponse } from 'next/server';
import { getScimContentHeaders } from '@/lib/scim/scim-server';
import { getResourceTypes } from '@/lib/scim/scim-schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    return NextResponse.json(getResourceTypes(baseUrl), {
      headers: getScimContentHeaders(),
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
