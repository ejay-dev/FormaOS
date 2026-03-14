import { NextResponse } from 'next/server';
import { getSchemasResponse } from '@/lib/scim/scim-schemas';
import { getScimContentHeaders } from '@/lib/scim/scim-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return NextResponse.json(getSchemasResponse(baseUrl), {
    headers: getScimContentHeaders(),
  });
}
