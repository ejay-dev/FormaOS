import { NextResponse } from 'next/server';
import { getScimContentHeaders } from '@/lib/scim/scim-server';
import { getResourceTypes } from '@/lib/scim/scim-schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return NextResponse.json(getResourceTypes(baseUrl), {
    headers: getScimContentHeaders(),
  });
}
