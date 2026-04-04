import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  createEnvelope,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';

type RouteContext = { params: Promise<{ reportId: string }> };

export const runtime = 'nodejs';

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['reports:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { reportId } = await context.params;
    const { data: report } = await auth.context.db
      .from('report_export_jobs')
      .select('*')
      .eq('organization_id', auth.context.orgId)
      .eq('id', reportId)
      .maybeSingle();

    if (!report) {
      const response = jsonWithContext(
        auth.context,
        { error: 'Report not found' },
        { status: 404 },
      );
      await logV1Access(auth.context, 404, 'reports:read');
      return response;
    }

    const { searchParams } = new URL(request.url);
    if (
      searchParams.get('download') === '1' ||
      searchParams.get('download') === 'true'
    ) {
      await logV1Access(auth.context, 302, 'reports:read');
      return NextResponse.redirect(
        report.file_url ??
          `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/reports/export?type=${report.report_type}`,
      );
    }

    await logV1Access(auth.context, 200, 'reports:read');
    return jsonWithContext(auth.context, createEnvelope(report));
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
