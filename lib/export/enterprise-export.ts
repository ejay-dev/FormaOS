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
import { buildReport } from '@/lib/audit-reports/report-builder';
import { generateReportPdf } from '@/lib/audit-reports/pdf-generator';
import type { ReportType } from '@/lib/audit-reports/types';
import { getQueueClient } from '@/lib/queue';

export interface EnterpriseExportOptions {
  includeCompliance: boolean;
  includeEvidence: boolean;
  includeAuditLogs: boolean;
  includeCareOps: boolean;
  includeTeam: boolean;
  /**
   * Packaged outcome exports used for enterprise onboarding/procurement.
   * Stored in `enterprise_export_jobs.options.bundleType`.
   */
  bundleType?: 'enterprise_full' | 'audit_ready_bundle' | 'proof_packet_14d' | 'monthly_exec_pack';
  /** Limit time-scoped datasets (audit logs, incidents, etc.) to last N days. */
  dateRangeDays?: number;
  /** Include report PDFs inside the zip. */
  includeReportPdfs?: boolean;
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

const DEFAULT_EXPORT_BUCKET =
  (process.env.ENTERPRISE_EXPORTS_BUCKET ?? '').trim() || 'audit-bundles';

function safeIsoDate(value: Date): string {
  try {
    return value.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function computeSinceIso(days?: number | null): string | null {
  if (!days || !Number.isFinite(days) || days <= 0) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return safeIsoDate(since);
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

    // Enqueue for background processing when Redis queue is available.
    try {
      const queue = getQueueClient();
      await queue.enqueue(
        'enterprise-export',
        { jobId: job.id, organizationId: orgId, requestedBy: userId },
        { organizationId: orgId },
      );
    } catch {
      // ignore (cron/manual trigger can still process)
    }

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
    status?: string | null;
    file_url?: string | null;
    expires_at?: string | null;
  } | null = null;

  // Try enterprise_export_jobs first
  const { data: enterpriseJob, error: enterpriseError } = await admin
    .from('enterprise_export_jobs')
    // NOTE: Do not select storage_* columns. Production schema may not include them yet.
    .select('organization_id, requested_by, options, status, file_url, expires_at')
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

  // Idempotency: if already completed and a direct file URL is still valid, do not regenerate.
  if (
    job.status === 'completed' &&
    job.file_url &&
    (!job.expires_at || new Date(job.expires_at).getTime() > Date.now())
  ) {
    const baseUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? '').trim() || 'http://localhost:3000';
    return { ok: true, downloadUrl: generateSignedDownloadUrl(baseUrl, jobId, orgId) };
  }
  const options: EnterpriseExportOptions = (job.options as EnterpriseExportOptions) || {
    includeCompliance: true,
    includeEvidence: true,
    includeAuditLogs: true,
    includeCareOps: true,
    includeTeam: true,
  };

  const bundleType = options.bundleType ?? 'enterprise_full';
  const dateRangeDays =
    options.dateRangeDays ??
    (bundleType === 'proof_packet_14d' ? 14 : bundleType === 'monthly_exec_pack' ? 30 : 90);
  const sinceIso = computeSinceIso(dateRangeDays);
  const includeReportPdfs =
    options.includeReportPdfs ?? bundleType !== 'enterprise_full';

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
        bundleType,
        since: sinceIso,
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
      exportData.auditLogs = await getAuditLogs(orgId, sinceIso);
    }

    if (options.includeCareOps) {
      await updateJobStatus(jobId, 'processing', 70);
      exportData.careOps = await getCareOpsData(orgId, sinceIso);
    }

    if (options.includeTeam) {
      await updateJobStatus(jobId, 'processing', 85);
      exportData.team = await getTeamData(orgId);
    }

    await updateJobStatus(jobId, 'processing', 90);

    // Create ZIP bundle
    const reportPdfs = includeReportPdfs
      ? await buildIncludedReportPdfs(orgId, bundleType)
      : [];

    const zipBuffer = await createExportZip(exportData, reportPdfs);
    const fileSize = zipBuffer.length;

    // Upload to Supabase Storage (private bucket) and store a short-lived signed URL
    // in the legacy `file_url` column for backwards-compatible downloads.
    //
    // Production schema may not include `storage_bucket/storage_path/content_type` yet.
    const datePart = new Date().toISOString().slice(0, 10);
    const storagePath = `${orgId}/enterprise-exports/${bundleType}/${datePart}/${jobId}.zip`;

    if (!('storage' in admin) || !admin.storage) {
      throw new Error('Supabase storage client unavailable');
    }

    const upload = await admin.storage
      .from(DEFAULT_EXPORT_BUCKET)
      .upload(storagePath, zipBuffer, { contentType: 'application/zip', upsert: false });

    if (upload.error) {
      throw new Error(`Storage upload failed: ${upload.error.message}`);
    }

    // Create a signed URL (default: 24 hours) and persist it on the job row.
    const ttlSeconds = 60 * 60 * 24;
    const signed = await admin.storage
      .from(DEFAULT_EXPORT_BUCKET)
      .createSignedUrl(storagePath, ttlSeconds);
    if (signed.error || !signed.data?.signedUrl) {
      throw new Error(signed.error?.message ?? 'Failed to sign export URL');
    }

    const baseUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? '').trim() || 'http://localhost:3000';
    const downloadUrl = generateSignedDownloadUrl(baseUrl, jobId, orgId);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    // Update job as completed
    await updateJobStatus(jobId, 'completed', 100, {
      file_url: signed.data.signedUrl,
      file_size: fileSize,
      expires_at: expiresAt,
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
    // NOTE: Do not select storage_* columns. Production schema may not include them yet.
    .select('id, organization_id, status, progress, file_url, file_size, expires_at, error_message')
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

  const baseUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? '').trim() || 'http://localhost:3000';
  const computedDownloadUrl =
    job.status === 'completed'
      ? generateSignedDownloadUrl(baseUrl, job.id, (job as any).organization_id ?? '')
      : undefined;

  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress || 0,
    // Prefer the auth-gated tokenized download endpoint. The endpoint will
    // redirect to the stored signed file_url once authorization is verified.
    downloadUrl: computedDownloadUrl ?? (job.file_url as string | null) ?? undefined,
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

  const safe = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };

  const [evaluations, snapshots] = await Promise.all([
    safe(() =>
      admin
        .from('org_control_evaluations')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500),
    ),
    safe(() =>
      admin
        .from('compliance_score_snapshots')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(120),
    ),
  ]);

  return {
    evaluations: (evaluations as any)?.data || [],
    snapshots: (snapshots as any)?.data || [],
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

async function getAuditLogs(
  orgId: string,
  sinceIso: string | null,
): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdminClient();

  const safeQuery = async (table: string, select: string) => {
    try {
      const q = admin.from(table).select(select).eq('organization_id', orgId);
      return await q.order('created_at', { ascending: false }).limit(10_000);
    } catch {
      return { data: null as any, error: null as any };
    }
  };

  // Prefer org_audit_events (structured) then fall back to legacy org_audit_logs.
  const { data: events } = await safeQuery(
    'org_audit_events',
    'id, action, actor_user_id, entity_type, entity_id, before_state, after_state, created_at',
  );

  if (events && events.length > 0) {
    const filtered = sinceIso
      ? events.filter((e: any) => e.created_at && e.created_at >= sinceIso)
      : events;
    return { auditEvents: filtered };
  }

  const { data: logs } = await safeQuery(
    'org_audit_logs',
    'id, action, actor_id, target_resource, metadata, created_at',
  );

  const filtered = sinceIso
    ? (logs ?? []).filter((e: any) => e.created_at && e.created_at >= sinceIso)
    : (logs ?? []);

  return { auditLogs: filtered };
}

async function getCareOpsData(orgId: string, sinceIso: string | null): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdminClient();

  // This may return empty if care ops tables don't exist for this org
  const results: Record<string, unknown> = {};

  try {
    let q = admin
      .from('org_patients')
      .select('id, full_name, status, created_at, updated_at')
      .eq('organization_id', orgId);
    if (sinceIso) q = q.gte('created_at', sinceIso);
    const { data: patients } = await q;
    results.patients = patients || [];
  } catch {
    results.patients = [];
  }

  try {
    // org_visits may not exist; keep best-effort.
    const { data: visits } = await admin
      .from('org_visits')
      .select('id, patient_id, status, scheduled_at, completed_at, created_at')
      .eq('organization_id', orgId);
    const filtered = sinceIso
      ? (visits ?? []).filter((v: any) => v.created_at && v.created_at >= sinceIso)
      : (visits ?? []);
    results.visits = filtered;
  } catch {
    results.visits = [];
  }

  try {
    let q = admin
      .from('org_incidents')
      .select('id, incident_type, status, severity, created_at, resolved_at, is_reportable')
      .eq('organization_id', orgId);
    if (sinceIso) q = q.gte('created_at', sinceIso);
    const { data: incidents } = await q;
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

  const userIds = (members || [])
    .map((m: { user_id: string }) => m.user_id)
    .filter(Boolean);

  // Best-effort enrichment via profiles (if present).
  if (userIds.length > 0) {
    try {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      return {
        members: (members || []).map((m: { user_id: string }) => {
          const p = (profiles ?? []).find((u: any) => u.id === m.user_id);
          return {
            ...m,
            fullName: p?.full_name ?? null,
            avatarUrl: p?.avatar_url ?? null,
          };
        }),
      };
    } catch {
      // ignore
    }
  }

  return { members: members || [] };
}

async function buildIncludedReportPdfs(
  orgId: string,
  bundleType: EnterpriseExportOptions['bundleType'],
): Promise<Array<{ name: string; buffer: Buffer }>> {
  const pdfs: Array<{ name: string; buffer: Buffer }> = [];
  const types: ReportType[] =
    bundleType === 'monthly_exec_pack'
      ? ['trust', 'iso27001']
      : bundleType === 'audit_ready_bundle'
        ? ['trust', 'iso27001', 'soc2']
        : ['trust'];

  for (const reportType of types) {
    try {
      const report = await buildReport(orgId, reportType);
      const pdfBlob = generateReportPdf(report as any, reportType);
      const ab = await pdfBlob.arrayBuffer();
      pdfs.push({
        name: `reports/${reportType}.pdf`,
        buffer: Buffer.from(ab),
      });
    } catch (err) {
      exportLogger.warn('enterprise_export_report_pdf_failed', {
        orgId,
        reportType,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return pdfs;
}

async function createExportZip(
  data: Record<string, unknown>,
  extraFiles: Array<{ name: string; buffer: Buffer }> = [],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    // Add metadata
    archive.append(JSON.stringify(data.metadata, null, 2), { name: 'manifest.json' });
    archive.append(
      [
        'FormaOS Enterprise Export Bundle',
        '',
        'This zip is generated from your live FormaOS org state.',
        'It is access-controlled and export actions are recorded in the audit trail.',
        '',
        'Contents:',
        '- manifest.json',
        '- compliance/data.json (if included)',
        '- evidence/metadata.json (if included)',
        '- audit-logs/*.json (if included)',
        '- care-ops/data.json (if included)',
        '- team/members.json (if included)',
        '- reports/*.pdf (if configured)',
        '',
      ].join('\n'),
      { name: 'README.txt' },
    );

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

    for (const f of extraFiles) {
      archive.append(f.buffer, { name: f.name });
    }

    archive.finalize();
  });
}
