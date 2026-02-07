/**
 * =========================================================
 * Enterprise Export Service
 * =========================================================
 * Full organization data export for enterprise portability
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canStartExport, trackExportStart, trackExportEnd } from './throttle';
import { generateSignedDownloadUrl } from '@/lib/security/export-tokens';
import { exportLogger } from '@/lib/observability/structured-logger';
import archiver from 'archiver';

export interface EnterpriseExportOptions {
  includeCompliance: boolean;
  includeEvidence: boolean;
  includeAuditLogs: boolean;
  includeCareOps: boolean;
  includeTeam: boolean;
}

export interface ExportJobResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  fileSize?: number;
  expiresAt?: string;
  errorMessage?: string;
}

/**
 * Create an enterprise export job
 */
export async function createEnterpriseExportJob(
  orgId: string,
  userId: string,
  options: EnterpriseExportOptions
): Promise<{ ok: boolean; jobId?: string; error?: string }> {
  const admin = createSupabaseAdminClient();

  // Check throttling
  const throttleCheck = await canStartExport(orgId);
  if (!throttleCheck.allowed) {
    return { ok: false, error: throttleCheck.reason };
  }

  try {
    // Create job record
    const { data: job, error } = await admin
      .from('enterprise_export_jobs')
      .insert({
        organization_id: orgId,
        requested_by: userId,
        status: 'pending',
        progress: 0,
        options,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select('id')
      .single();

    if (error) {
      // If table doesn't exist, use compliance_export_jobs as fallback
      if (error.message.includes('does not exist')) {
        const { data: fallbackJob, error: fallbackError } = await admin
          .from('compliance_export_jobs')
          .insert({
            organization_id: orgId,
            framework_slug: 'enterprise-full',
            requested_by: userId,
            status: 'pending',
            progress: 0,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .select('id')
          .single();

        if (fallbackError) {
          return { ok: false, error: fallbackError.message };
        }
        return { ok: true, jobId: fallbackJob.id };
      }
      return { ok: false, error: error.message };
    }

    exportLogger.info('enterprise_export_created', { orgId, jobId: job.id });
    return { ok: true, jobId: job.id };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    exportLogger.error('enterprise_export_create_failed', err, { orgId });
    return { ok: false, error: err.message };
  }
}

/**
 * Process an enterprise export job
 */
export async function processEnterpriseExportJob(
  jobId: string
): Promise<{ ok: boolean; downloadUrl?: string; error?: string }> {
  const admin = createSupabaseAdminClient();

  // Load job
  let job: {
    organization_id: string;
    requested_by: string;
    options: EnterpriseExportOptions | null;
  } | null = null;

  // Try enterprise_export_jobs first
  const { data: enterpriseJob, error: enterpriseError } = await admin
    .from('enterprise_export_jobs')
    .select('organization_id, requested_by, options')
    .eq('id', jobId)
    .single();

  if (enterpriseError && enterpriseError.message.includes('does not exist')) {
    // Fallback to compliance_export_jobs
    const { data: fallbackJob } = await admin
      .from('compliance_export_jobs')
      .select('organization_id, requested_by')
      .eq('id', jobId)
      .single();

    if (fallbackJob) {
      job = { ...fallbackJob, options: null };
    }
  } else if (enterpriseJob) {
    job = enterpriseJob as typeof job;
  }

  if (!job) {
    return { ok: false, error: 'Export job not found' };
  }

  const { organization_id: orgId, requested_by: userId } = job;
  const options: EnterpriseExportOptions = (job.options as EnterpriseExportOptions) || {
    includeCompliance: true,
    includeEvidence: true,
    includeAuditLogs: true,
    includeCareOps: true,
    includeTeam: true,
  };

  // Track export start
  trackExportStart(orgId, jobId);

  try {
    exportLogger.info('enterprise_export_started', { jobId, orgId });

    // Update status
    await updateJobStatus(jobId, 'processing', 0);

    // Gather data based on options
    const exportData: Record<string, unknown> = {
      metadata: {
        exportId: jobId,
        organizationId: orgId,
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        options,
      },
    };

    if (options.includeCompliance) {
      await updateJobStatus(jobId, 'processing', 10);
      exportData.compliance = await getComplianceData(orgId);
    }

    if (options.includeEvidence) {
      await updateJobStatus(jobId, 'processing', 30);
      exportData.evidence = await getEvidenceMetadata(orgId);
    }

    if (options.includeAuditLogs) {
      await updateJobStatus(jobId, 'processing', 50);
      exportData.auditLogs = await getAuditLogs(orgId);
    }

    if (options.includeCareOps) {
      await updateJobStatus(jobId, 'processing', 70);
      exportData.careOps = await getCareOpsData(orgId);
    }

    if (options.includeTeam) {
      await updateJobStatus(jobId, 'processing', 85);
      exportData.team = await getTeamData(orgId);
    }

    await updateJobStatus(jobId, 'processing', 90);

    // Create ZIP bundle
    const zipBuffer = await createExportZip(exportData);
    const fileSize = zipBuffer.length;

    // Generate signed download URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.formaos.com';
    const downloadUrl = generateSignedDownloadUrl(baseUrl, jobId, userId, orgId);

    // Update job as completed
    await updateJobStatus(jobId, 'completed', 100, {
      file_url: downloadUrl,
      file_size: fileSize,
      completed_at: new Date().toISOString(),
    });

    exportLogger.info('enterprise_export_completed', { jobId, orgId, fileSize });
    return { ok: true, downloadUrl };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    exportLogger.error('enterprise_export_failed', err, { jobId, orgId });

    await updateJobStatus(jobId, 'failed', 0, {
      error_message: err.message,
    });

    return { ok: false, error: err.message };
  } finally {
    trackExportEnd(orgId, jobId);
  }
}

/**
 * Get export job status
 */
export async function getExportJobStatus(jobId: string): Promise<ExportJobResult | null> {
  const admin = createSupabaseAdminClient();

  // Try enterprise table first
  const { data: job, error } = await admin
    .from('enterprise_export_jobs')
    .select('id, status, progress, file_url, file_size, expires_at, error_message')
    .eq('id', jobId)
    .single();

  if (error && error.message.includes('does not exist')) {
    // Fallback to compliance table
    const { data: fallbackJob } = await admin
      .from('compliance_export_jobs')
      .select('id, status, progress, file_url, file_size, expires_at, error_message')
      .eq('id', jobId)
      .single();

    if (!fallbackJob) return null;

    return {
      jobId: fallbackJob.id,
      status: fallbackJob.status,
      progress: fallbackJob.progress || 0,
      downloadUrl: fallbackJob.file_url,
      fileSize: fallbackJob.file_size,
      expiresAt: fallbackJob.expires_at,
      errorMessage: fallbackJob.error_message,
    };
  }

  if (!job) return null;

  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress || 0,
    downloadUrl: job.file_url,
    fileSize: job.file_size,
    expiresAt: job.expires_at,
    errorMessage: job.error_message,
  };
}

async function updateJobStatus(
  jobId: string,
  status: string,
  progress: number,
  extra?: Record<string, unknown>
): Promise<void> {
  const admin = createSupabaseAdminClient();

  // Try enterprise table first
  const { error } = await admin
    .from('enterprise_export_jobs')
    .update({ status, progress, ...extra })
    .eq('id', jobId);

  if (error && error.message.includes('does not exist')) {
    // Fallback to compliance table
    await admin
      .from('compliance_export_jobs')
      .update({ status, progress, ...extra })
      .eq('id', jobId);
  }
}

async function getComplianceData(orgId: string): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdminClient();

  const [controls, evaluations, snapshots] = await Promise.all([
    admin.from('org_control_evaluations').select('*').eq('organization_id', orgId),
    admin.from('compliance_scores').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(100),
    admin.from('compliance_snapshots').select('*').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
  ]);

  return {
    controls: controls.data || [],
    evaluations: evaluations.data || [],
    snapshots: snapshots.data || [],
  };
}

async function getEvidenceMetadata(orgId: string): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdminClient();

  // Return metadata only, not actual files
  const { data } = await admin
    .from('org_evidence')
    .select('id, title, evidence_type, verification_status, uploaded_at, file_name, metadata')
    .eq('organization_id', orgId);

  return {
    evidence: (data || []).map((e: { file_url?: string; [key: string]: unknown }) => ({
      ...e,
      // Exclude actual file URLs for security
      file_url: undefined,
    })),
  };
}

async function getAuditLogs(orgId: string): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdminClient();

  // Get last 90 days of audit logs
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data } = await admin
    .from('org_audit_logs')
    .select('id, action, actor_id, target_resource, metadata, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(10000);

  return { auditLogs: data || [] };
}

async function getCareOpsData(orgId: string): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdminClient();

  // This may return empty if care ops tables don't exist for this org
  const results: Record<string, unknown> = {};

  try {
    const { data: patients } = await admin
      .from('patients')
      .select('id, name, status, created_at, updated_at')
      .eq('organization_id', orgId);
    results.patients = patients || [];
  } catch {
    results.patients = [];
  }

  try {
    const { data: visits } = await admin
      .from('visits')
      .select('id, patient_id, status, scheduled_at, completed_at')
      .eq('organization_id', orgId);
    results.visits = visits || [];
  } catch {
    results.visits = [];
  }

  try {
    const { data: incidents } = await admin
      .from('incidents')
      .select('id, type, status, severity, reported_at, resolved_at')
      .eq('organization_id', orgId);
    results.incidents = incidents || [];
  } catch {
    results.incidents = [];
  }

  return results;
}

async function getTeamData(orgId: string): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdminClient();

  const { data: members } = await admin
    .from('org_members')
    .select('id, role, invited_at, joined_at, user_id')
    .eq('organization_id', orgId);

  // Get user details (without sensitive data)
  const userIds = (members || []).map((m: { user_id: string }) => m.user_id).filter(Boolean);

  if (userIds.length > 0) {
    const { data: users } = await admin
      .from('users')
      .select('id, name, email, created_at')
      .in('id', userIds);

    return {
      members: (members || []).map((m: { user_id: string }) => {
        const user = users?.find((u: { id: string }) => u.id === m.user_id);
        return {
          ...m,
          userName: user?.name,
          userEmail: user?.email,
        };
      }),
    };
  }

  return { members: members || [] };
}

async function createExportZip(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    // Add metadata
    archive.append(JSON.stringify(data.metadata, null, 2), { name: 'manifest.json' });

    // Add each data section
    if (data.compliance) {
      archive.append(JSON.stringify(data.compliance, null, 2), { name: 'compliance/data.json' });
    }
    if (data.evidence) {
      archive.append(JSON.stringify(data.evidence, null, 2), { name: 'evidence/metadata.json' });
    }
    if (data.auditLogs) {
      archive.append(JSON.stringify(data.auditLogs, null, 2), { name: 'audit-logs/logs.json' });
    }
    if (data.careOps) {
      archive.append(JSON.stringify(data.careOps, null, 2), { name: 'care-ops/data.json' });
    }
    if (data.team) {
      archive.append(JSON.stringify(data.team, null, 2), { name: 'team/members.json' });
    }

    archive.finalize();
  });
}
