import { authenticateV1Request, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { createEnvelope } from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';
import { getActorId } from '@/lib/api/v1-helpers';
import { createReportExportJob } from '@/lib/reports/export-jobs';
import type { ReportType } from '@/lib/audit-reports/types';

const VALID_REPORT_TYPES: ReportType[] = ['soc2', 'iso27001', 'ndis', 'hipaa', 'trust'];

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['reports:read'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { limit, offset } = getPagination(request, 25, 100);
  const { data, count } = await auth.context.db
    .from('report_export_jobs')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.context.orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  await logV1Access(auth.context, 200, 'reports:read');
  return jsonWithContext(
    auth.context,
    paginatedEnvelope(data ?? [], { offset, limit, total: count ?? data?.length ?? 0 }),
  );
}

export async function POST(request: Request) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['reports:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as
    | { reportType?: unknown; format?: unknown }
    | null;
  const reportType = typeof body?.reportType === 'string' ? (body.reportType as ReportType) : null;
  const format =
    body?.format === 'json' || body?.format === 'pdf' ? body.format : 'pdf';

  if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
    const response = jsonWithContext(auth.context, { error: 'Invalid report type' }, { status: 400 });
    await logV1Access(auth.context, 400, 'reports:write');
    return response;
  }

  const result = await createReportExportJob({
    organizationId: auth.context.orgId,
    requestedBy: getActorId(auth.context),
    reportType,
    format,
  });

  if (!result.ok || !result.jobId) {
    const response = jsonWithContext(
      auth.context,
      { error: result.error ?? 'Failed to create report job' },
      { status: 500 },
    );
    await logV1Access(auth.context, 500, 'reports:write');
    return response;
  }

  await logV1Access(auth.context, 201, 'reports:write');
  return jsonWithContext(
    auth.context,
    createEnvelope({ id: result.jobId, status: 'pending', reportType, format }),
    { status: 201 },
  );
}
