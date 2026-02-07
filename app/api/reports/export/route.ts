import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildReport } from '@/lib/audit-reports/report-builder';
import { generateReportPdf } from '@/lib/audit-reports/pdf-generator';
import type { ReportType } from '@/lib/audit-reports/types';

const VALID_REPORT_TYPES: ReportType[] = ['soc2', 'iso27001', 'ndis', 'hipaa'];

/**
 * GET /api/reports/export
 * Generate and download an audit report
 * Query params:
 *   - type: soc2 | iso27001 | ndis | hipaa
 *   - format: pdf | json (default: pdf)
 */
export async function GET(request: NextRequest) {
  let supabase;
  let userId: string;
  let orgId: string;

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const reportType = searchParams.get('type') as ReportType | null;
  const format = searchParams.get('format') || 'pdf';

  // Validate report type
  if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: `Invalid report type. Valid types: ${VALID_REPORT_TYPES.join(', ')}`,
        code: 'INVALID_REPORT_TYPE',
      },
      { status: 400 }
    );
  }

  // TENANT ISOLATION: Authenticate user
  try {
    supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    userId = user.id;
  } catch (authError) {
    console.error('[Report Export] Auth error:', authError);
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication failed.',
        code: 'AUTH_ERROR',
      },
      { status: 401 }
    );
  }

  // TENANT ISOLATION: Get organization and verify role
  try {
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Organization membership not found.',
          code: 'ORG_NOT_FOUND',
        },
        { status: 403 }
      );
    }

    // Reports require admin access
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Admin access required to generate reports.',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      );
    }

    orgId = membership.organization_id;
  } catch (orgError) {
    console.error('[Report Export] Org lookup error:', orgError);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to lookup organization.',
        code: 'ORG_LOOKUP_ERROR',
      },
      { status: 500 }
    );
  }

  try {
    // Build the report
    const report = await buildReport(orgId, reportType);

    // Return based on format
    if (format === 'json') {
      return NextResponse.json({
        report,
        generatedAt: new Date().toISOString(),
      });
    }

    // Generate PDF
    const pdfBlob = generateReportPdf(report, reportType);
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Generate filename
    const orgName = report.organizationName.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    const filename = `${orgName}_${reportType.toUpperCase()}_Report_${date}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('[Report Export] Generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to generate report.',
        code: 'GENERATION_ERROR',
      },
      { status: 500 }
    );
  }
}
