import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildReport } from '@/lib/audit-reports/report-builder';
import { generateReportPdf } from '@/lib/audit-reports/pdf-generator';
import type { ReportType } from '@/lib/audit-reports/types';
import { createReportExportJob, processReportExportJob } from '@/lib/reports/export-jobs';

const VALID_REPORT_TYPES: ReportType[] = ['soc2', 'iso27001', 'ndis', 'hipaa', 'trust'];

/**
 * GET /api/reports/export
 * Generate and download an audit report
 * Query params:
 *   - type: soc2 | iso27001 | ndis | hipaa | trust
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
  const asyncMode =
    searchParams.get('mode') === 'async' || searchParams.get('async') === '1';

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
    if (asyncMode) {
      const jobResult = await createReportExportJob({
        organizationId: orgId,
        requestedBy: userId,
        reportType,
        format: format === 'json' ? 'json' : 'pdf',
      });

      if (!jobResult.ok || !jobResult.jobId) {
        return NextResponse.json(
          {
            error: 'Internal Server Error',
            message: jobResult.error ?? 'Failed to create export job.',
            code: 'JOB_CREATE_FAILED',
          },
          { status: 500 }
        );
      }

      const inlineProcessingEnabled =
        (process.env.REPORT_EXPORTS_INLINE_PROCESSING ?? 'true') !== 'false';

      if (inlineProcessingEnabled) {
        processReportExportJob(jobResult.jobId, {
          workerId: 'inline',
          maxAttempts: 3,
        }).catch((err) => {
          console.error(
            `[Report Export] Background job ${jobResult.jobId} failed:`,
            err
          );
        });
      }

      return NextResponse.json({
        ok: true,
        jobId: jobResult.jobId,
        status: 'pending',
      });
    }

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
