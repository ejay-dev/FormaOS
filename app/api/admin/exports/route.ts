import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { handleAdminError, ADMIN_CACHE_HEADERS } from '@/app/api/admin/_helpers';

export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    const [complianceRes, reportRes] = await Promise.all([
      admin
        .from('compliance_export_jobs')
        .select(
          'id, organization_id, framework_slug, status, progress, file_url, file_size, error_message, created_at, completed_at',
        )
        .order('created_at', { ascending: false })
        .limit(50),
      admin
        .from('report_export_jobs')
        .select(
          'id, organization_id, report_type, format, status, progress, file_url, file_size, error_message, created_at, completed_at',
        )
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (complianceRes.error || reportRes.error) {
      console.error('/api/admin/exports query errors:', {
        compliance: complianceRes.error,
        report: reportRes.error,
      });
    }

    const complianceJobs = (complianceRes.data ?? []).map((job: any) => ({
      id: job.id,
      organizationId: job.organization_id,
      type: 'compliance',
      label: `Evidence Pack · ${job.framework_slug}`,
      status: job.status,
      progress: job.progress ?? 0,
      fileUrl: job.file_url,
      fileSize: job.file_size,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    }));

    const reportJobs = (reportRes.data ?? []).map((job: any) => ({
      id: job.id,
      organizationId: job.organization_id,
      type: 'report',
      label: `Report · ${job.report_type}${job.format ? ` (${job.format})` : ''}`,
      status: job.status,
      progress: job.progress ?? 0,
      fileUrl: job.file_url,
      fileSize: job.file_size,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    }));

    const jobs = [...complianceJobs, ...reportJobs].sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

    const orgIds = Array.from(
      new Set(jobs.map((job) => job.organizationId).filter(Boolean)),
    );
    let orgMap = new Map<string, string>();
    if (orgIds.length > 0) {
      const { data: orgs } = await admin
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      orgMap = new Map((orgs ?? []).map((org: any) => [org.id, org.name]));
    }

    const jobsWithOrg = jobs.map((job) => ({
      ...job,
      organizationName: orgMap.get(job.organizationId) ?? null,
    }));

    return NextResponse.json(
      { jobs: jobsWithOrg },
      { headers: ADMIN_CACHE_HEADERS },
    );
  } catch (error) {
    return handleAdminError(error, '/api/admin/exports');
  }
}

