import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';

export const runtime = 'nodejs';

function getExpiryStatus(row: Record<string, unknown>) {
  const expiresAt =
    row.expires_at ?? row.expiry_date ?? row.valid_until ?? null;
  if (!expiresAt || typeof expiresAt !== 'string') return 'unknown';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return 'expired';
  if (diff < 30 * 24 * 60 * 60 * 1000) return 'expiring';
  return 'active';
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['certificates:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { limit, offset, searchParams } = getPagination(request, 25, 100);
    const status = searchParams.get('status');

    const { data, count } = await auth.context.db
      .from('org_certifications')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.context.orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const shaped = (data ?? [])
      .map((certificate: Record<string, unknown>) => ({
        ...certificate,
        expiry_status: getExpiryStatus(certificate),
      }))
      .filter(
        (certificate: Record<string, unknown> & { expiry_status: string }) =>
          !status || certificate.expiry_status === status,
      );

    await logV1Access(auth.context, 200, 'certificates:read');
    return jsonWithContext(
      auth.context,
      paginatedEnvelope(shaped, {
        offset,
        limit,
        total: count ?? shaped.length,
      }),
    );
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
