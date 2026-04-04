import { NextResponse } from 'next/server';
import {
  exportIdentityEvents,
  queryIdentityEvents,
  type IdentityEventType,
} from '@/lib/identity/audit';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import { rateLimitApi } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const rl = await rateLimitApi(request);
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const url = new URL(request.url);
    const context = await requireOrgAdminContext(url.searchParams.get('orgId'));
    const format =
      (url.searchParams.get('format') as 'json' | 'csv' | 'pdf' | null) ?? null;
    const filters = {
      orgId: context.orgId,
      eventTypes: url.searchParams.getAll('eventType') as IdentityEventType[],
      actorId: url.searchParams.get('actorId'),
      actorLabel: url.searchParams.get('actorLabel'),
      targetUserId: url.searchParams.get('targetUserId'),
      targetUserEmail: url.searchParams.get('targetUserEmail'),
      result:
        (url.searchParams.get('result') as 'success' | 'failure' | null) ??
        undefined,
      dateFrom: url.searchParams.get('dateFrom'),
      dateTo: url.searchParams.get('dateTo'),
      limit: Number(url.searchParams.get('limit') ?? 50),
      offset: Number(url.searchParams.get('offset') ?? 0),
    };

    if (format) {
      const exported = await exportIdentityEvents(filters, format);
      return new NextResponse(exported.body as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': exported.mimeType,
          'Content-Disposition': `attachment; filename="${exported.filename}"`,
        },
      });
    }

    const payload = await queryIdentityEvents(filters);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Forbidden',
      },
      { status: 403 },
    );
  }
}
