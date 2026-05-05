import { NextRequest, NextResponse } from 'next/server';
import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { buildReport } from '@/lib/audit-reports/report-builder';
import { generateReportPdf } from '@/lib/audit-reports/pdf-generator';
import type { ReportType } from '@/lib/audit-reports/types';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/audit-portal/[token]/reports/download');
const VALID_REPORT_TYPES: ReportType[] = [
  'soc2',
  'iso27001',
  'ndis',
  'hipaa',
  'trust',
];

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const tokenData = await validateAuditorToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid auditor token' },
        { status: 401 },
      );
    }

    const reportType = request.nextUrl.searchParams.get(
      'type',
    ) as ReportType | null;
    if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 },
      );
    }

    const report = await buildReport(tokenData.org_id, reportType);
    const pdfBlob = generateReportPdf(report, reportType);
    const pdfBuffer = await pdfBlob.arrayBuffer();
    const filename = `${sanitizeSegment(report.organizationName || 'FormaOS') || 'FormaOS'}-${sanitizeSegment(report.frameworkName || reportType.toUpperCase()) || reportType.toUpperCase()}-Report-${new Date().toISOString().slice(0, 10)}.pdf`;

    await logAuditorActivity(
      tokenData.id,
      tokenData.org_id,
      'downloaded_report',
      'report',
      reportType,
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    log.error({ err: error }, 'auditor report download failed');
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 },
    );
  }
}
