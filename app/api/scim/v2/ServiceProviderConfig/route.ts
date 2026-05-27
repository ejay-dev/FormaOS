import { NextResponse } from 'next/server';
import { getScimContentHeaders } from '@/lib/scim/scim-server';
import { getServiceProviderConfig } from '@/lib/scim/scim-schemas';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/scim/v2/ServiceProviderConfig');

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    return NextResponse.json(getServiceProviderConfig(baseUrl), {
      headers: getScimContentHeaders(),
    });
  } catch (error) {
    log.error({ err: error }, '[SCIM] Unhandled error:');
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
