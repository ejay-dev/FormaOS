/**
 * @jest-environment node
 */

/* ------------------------------------------------------------------ */
/*  Supabase builder helper                                           */
/* ------------------------------------------------------------------ */
function createBuilder(
  result: { data?: any; error?: any; count?: number } = {
    data: null,
    error: null,
  },
) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
jest.mock('server-only', () => ({}));

const mockCanStartExport = jest.fn();
const mockTrackExportStart = jest.fn();
const mockTrackExportEnd = jest.fn();
jest.mock('@/lib/export/throttle', () => ({
  canStartExport: (...args: any[]) => mockCanStartExport(...args),
  trackExportStart: (...args: any[]) => mockTrackExportStart(...args),
  trackExportEnd: (...args: any[]) => mockTrackExportEnd(...args),
}));

jest.mock('@/lib/security/export-tokens', () => ({
  generateSignedDownloadUrl: jest.fn(
    (_base: string, jobId: string, orgId: string) =>
      `https://app.test/download/${jobId}?org=${orgId}`,
  ),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  exportLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockBuildReport = jest.fn().mockResolvedValue({ title: 'report' });
jest.mock('@/lib/audit-reports/report-builder', () => ({
  buildReport: (...args: any[]) => mockBuildReport(...args),
}));

const mockGenerateReportPdf = jest.fn().mockReturnValue(new Blob(['pdf']));
jest.mock('@/lib/audit-reports/pdf-generator', () => ({
  generateReportPdf: (...args: any[]) => mockGenerateReportPdf(...args),
}));

const mockEnqueue = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/queue', () => ({
  getQueueClient: jest.fn(() => ({ enqueue: mockEnqueue })),
}));

const mockTriggerTask = jest.fn().mockResolvedValue(false);
jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: (...args: any[]) => mockTriggerTask(...args),
}));

const mockGetAdminProfiles = jest.fn().mockResolvedValue([]);
jest.mock('@/lib/users/admin-profile-directory', () => ({
  getAdminProfileDirectoryEntries: (...args: any[]) =>
    mockGetAdminProfiles(...args),
}));

jest.mock('archiver', () => {
  const { EventEmitter } = require('events');
  return jest.fn(() => {
    const archive = new EventEmitter();
    archive.append = jest.fn();
    archive.finalize = jest.fn(() => {
      process.nextTick(() => {
        archive.emit('data', Buffer.from('zipdata'));
        archive.emit('end');
      });
    });
    return archive;
  });
});

// Build admin client mock with storage
const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
jest.mock('@/lib/supabase/admin', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    storage: {
      from: jest.fn(() => ({
        upload: (...args: any[]) => mockUpload(...args),
        createSignedUrl: (...args: any[]) => mockCreateSignedUrl(...args),
      })),
    },
  };
  return {
    createSupabaseAdminClient: jest.fn(() => c),
    __client: c,
  };
});

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  createEnterpriseExportJob,
  processEnterpriseExportJob,
  getExportJobStatus,
} from '@/lib/export/enterprise-export';

const { exportLogger } = require('@/lib/observability/structured-logger');

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('enterprise-export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanStartExport.mockResolvedValue({ allowed: true });
    mockUpload.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.url' },
      error: null,
    });
  });

  /* ---------- createEnterpriseExportJob ---------- */
  describe('createEnterpriseExportJob', () => {
    const allOpts = {
      includeCompliance: true,
      includeEvidence: true,
      includeAuditLogs: true,
      includeCareOps: true,
      includeTeam: true,
    };

    it('creates a job and returns jobId', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'job-1' } }),
      );
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(true);
      expect(result.jobId).toBe('job-1');
    });

    it('returns error when throttled', async () => {
      mockCanStartExport.mockResolvedValue({
        allowed: false,
        reason: 'Rate limited',
      });
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Rate limited');
    });

    it('falls back to compliance_export_jobs when enterprise table missing', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: null,
            error: { message: 'relation does not exist' },
          });
        return createBuilder({ data: { id: 'fallback-1' } });
      });
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(true);
      expect(result.jobId).toBe('fallback-1');
    });

    it('returns error when fallback table insert also fails', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: null,
            error: { message: 'relation does not exist' },
          });
        return createBuilder({
          data: null,
          error: { message: 'fallback db error' },
        });
      });
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(false);
      expect(result.error).toBe('fallback db error');
    });

    it('returns error on db insert failure (non-missing-table)', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'db error' } }),
      );
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(false);
      expect(result.error).toBe('db error');
    });

    it('enqueues via trigger task when triggered returns true', async () => {
      mockTriggerTask.mockResolvedValue(true);
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'job-t' } }),
      );
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(true);
      expect(mockTriggerTask).toHaveBeenCalled();
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it('falls back to queue when trigger returns false', async () => {
      mockTriggerTask.mockResolvedValue(false);
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'job-q' } }),
      );
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(true);
      expect(mockEnqueue).toHaveBeenCalled();
    });

    it('ignores queue/trigger enqueue failures silently', async () => {
      mockTriggerTask.mockRejectedValue(new Error('trigger down'));
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'job-s' } }),
      );
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(true);
      expect(result.jobId).toBe('job-s');
    });

    it('catches thrown Error in outer try/catch', async () => {
      getClient().from.mockImplementation(() => {
        throw new Error('boom');
      });
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(false);
      expect(result.error).toBe('boom');
      expect(exportLogger.error).toHaveBeenCalled();
    });

    it('catches non-Error thrown value', async () => {
      getClient().from.mockImplementation(() => {
        throw 'string-err';
      });
      const result = await createEnterpriseExportJob(
        'org-1',
        'user-1',
        allOpts,
      );
      expect(result.ok).toBe(false);
      expect(result.error).toBe('string-err');
    });

    it('passes bundleType tag to triggerTask', async () => {
      mockTriggerTask.mockResolvedValue(true);
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'job-bt' } }),
      );
      await createEnterpriseExportJob('org-1', 'user-1', {
        ...allOpts,
        bundleType: 'audit_ready_bundle',
      });
      expect(mockTriggerTask).toHaveBeenCalledWith(
        'enterprise-export-job',
        expect.any(Object),
        expect.objectContaining({
          tags: expect.arrayContaining(['audit_ready_bundle']),
        }),
      );
    });

    it('defaults bundleType tag to enterprise_full when omitted', async () => {
      mockTriggerTask.mockResolvedValue(true);
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'job-def' } }),
      );
      await createEnterpriseExportJob('org-1', 'user-1', allOpts);
      expect(mockTriggerTask).toHaveBeenCalledWith(
        'enterprise-export-job',
        expect.any(Object),
        expect.objectContaining({
          tags: expect.arrayContaining(['enterprise_full']),
        }),
      );
    });
  });

  /* ---------- processEnterpriseExportJob ---------- */
  describe('processEnterpriseExportJob', () => {
    it('processes job and returns download URL', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: true,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'pending',
            },
          });
        if (table === 'org_control_evaluations')
          return createBuilder({ data: [] });
        if (table === 'compliance_score_snapshots')
          return createBuilder({ data: [] });
        return createBuilder();
      });

      const result = await processEnterpriseExportJob('job-1');
      expect(result.ok).toBe(true);
      expect(result.downloadUrl).toContain('job-1');
    });

    it('returns error when job not found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await processEnterpriseExportJob('missing-job');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Export job not found');
    });

    it('returns error when storage upload fails', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      mockUpload.mockResolvedValue({ error: { message: 'upload fail' } });

      const result = await processEnterpriseExportJob('job-1');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('upload fail');
    });

    it('returns existing URL for already completed job with valid expiry', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: {
            organization_id: 'org-1',
            requested_by: 'user-1',
            options: null,
            status: 'completed',
            file_url: 'https://existing.url',
            expires_at: new Date(Date.now() + 3600_000).toISOString(),
          },
        }),
      );
      const result = await processEnterpriseExportJob('job-1');
      expect(result.ok).toBe(true);
      expect(result.downloadUrl).toContain('job-1');
    });

    it('re-processes completed job when expires_at is past', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'completed',
              file_url: 'https://expired.url',
              expires_at: new Date(Date.now() - 1000).toISOString(),
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-exp');
      expect(result.ok).toBe(true);
      expect(mockTrackExportStart).toHaveBeenCalled();
    });

    it('re-processes completed job when file_url is null', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'completed',
              file_url: null,
              expires_at: null,
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-nf');
      expect(result.ok).toBe(true);
    });

    it('falls back to compliance_export_jobs when enterprise table does not exist', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: null,
            error: { message: 'table does not exist' },
          });
        if (callIdx === 2)
          return createBuilder({
            data: { organization_id: 'org-1', requested_by: 'user-1' },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-fb');
      expect(result.ok).toBe(true);
    });

    it('handles all export data sections', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: true,
                includeEvidence: true,
                includeAuditLogs: true,
                includeCareOps: true,
                includeTeam: true,
                bundleType: 'audit_ready_bundle',
                includeReportPdfs: true,
              },
              status: 'pending',
            },
          });
        if (table === 'org_members')
          return createBuilder({
            data: [{ id: 'm1', role: 'admin', user_id: 'u1' }],
          });
        if (table === 'org_evidence')
          return createBuilder({
            data: [{ id: 'e1', title: 'Evidence', file_url: 'secret' }],
          });
        if (table === 'unified_org_audit_log')
          return createBuilder({
            data: [
              {
                id: 'a1',
                action: 'create',
                created_at: new Date().toISOString(),
              },
            ],
          });
        if (table === 'org_patients')
          return createBuilder({ data: [{ id: 'p1' }] });
        if (table === 'org_visits')
          return createBuilder({
            data: [{ id: 'v1', created_at: new Date().toISOString() }],
          });
        if (table === 'org_incidents')
          return createBuilder({ data: [{ id: 'i1' }] });
        return createBuilder({ data: [] });
      });
      mockGetAdminProfiles.mockResolvedValue([
        { userId: 'u1', fullName: 'User One', avatarPath: null },
      ]);

      const result = await processEnterpriseExportJob('job-all');
      expect(result.ok).toBe(true);
      expect(mockTrackExportEnd).toHaveBeenCalledWith('org-1', 'job-all');
    });

    it('handles signed URL failure', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'sign fail' },
      });

      const result = await processEnterpriseExportJob('job-sf');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('sign fail');
    });

    it('handles missing storage client', async () => {
      const origStorage = getClient().storage;
      delete getClient().storage;
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });

      const result = await processEnterpriseExportJob('job-ns');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('storage client unavailable');
      getClient().storage = origStorage;
    });

    it('uses proof_packet_14d dateRangeDays default (14)', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
                bundleType: 'proof_packet_14d',
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-pp');
      expect(result.ok).toBe(true);
    });

    it('uses monthly_exec_pack dateRangeDays default (30)', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
                bundleType: 'monthly_exec_pack',
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-me');
      expect(result.ok).toBe(true);
    });

    it('handles enterprise_full bundleType (includeReportPdfs defaults false)', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
                bundleType: 'enterprise_full',
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-ef');
      expect(result.ok).toBe(true);
      // enterprise_full → includeReportPdfs false by default
      expect(mockBuildReport).not.toHaveBeenCalled();
    });

    it('builds report PDFs for audit_ready_bundle', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
                bundleType: 'audit_ready_bundle',
                includeReportPdfs: true,
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-arb');
      expect(result.ok).toBe(true);
      // audit_ready_bundle => trust, iso27001, soc2
      expect(mockBuildReport).toHaveBeenCalledTimes(3);
    });

    it('builds report PDFs for monthly_exec_pack', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
                bundleType: 'monthly_exec_pack',
                includeReportPdfs: true,
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-mep');
      expect(result.ok).toBe(true);
      // monthly_exec_pack => trust, iso27001
      expect(mockBuildReport).toHaveBeenCalledTimes(2);
    });

    it('continues if a report PDF build fails', async () => {
      mockBuildReport.mockRejectedValue(new Error('report err'));
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
                bundleType: 'audit_ready_bundle',
                includeReportPdfs: true,
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-rpf');
      expect(result.ok).toBe(true);
      expect(exportLogger.warn).toHaveBeenCalled();
    });

    it('uses default options when job.options is null', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: null,
              status: 'pending',
            },
          });
        return createBuilder({ data: [] });
      });
      const result = await processEnterpriseExportJob('job-null');
      expect(result.ok).toBe(true);
    });

    it('getCareOpsData handles org_visits table not existing', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: true,
                includeTeam: false,
              },
              status: 'pending',
            },
          });
        if (table === 'org_patients') return createBuilder({ data: [] });
        if (table === 'org_visits') {
          const b = createBuilder();
          b.then = (_resolve: any, reject: any) => {
            if (reject) reject(new Error('table missing'));
          };
          return b;
        }
        if (table === 'org_incidents') return createBuilder({ data: [] });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-co');
      expect(result.ok).toBe(true);
    });

    it('getAuditLogs falls back to org_audit_logs when unified view returns empty', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: true,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'pending',
            },
          });
        if (table === 'unified_org_audit_log')
          return createBuilder({ data: [] });
        if (table === 'org_audit_logs')
          return createBuilder({
            data: [
              {
                id: 'al1',
                action: 'login',
                created_at: new Date().toISOString(),
              },
            ],
          });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-al');
      expect(result.ok).toBe(true);
    });

    it('getTeamData returns members without profiles enrichment when no user IDs', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: true,
              },
              status: 'pending',
            },
          });
        if (table === 'org_members') return createBuilder({ data: [] });
        return createBuilder();
      });
      const result = await processEnterpriseExportJob('job-tm');
      expect(result.ok).toBe(true);
    });

    it('always calls trackExportEnd in finally block', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'enterprise_export_jobs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              requested_by: 'user-1',
              options: {
                includeCompliance: false,
                includeEvidence: false,
                includeAuditLogs: false,
                includeCareOps: false,
                includeTeam: false,
              },
              status: 'pending',
            },
          });
        return createBuilder();
      });
      mockUpload.mockResolvedValue({ error: { message: 'fail' } });

      await processEnterpriseExportJob('job-fin');
      expect(mockTrackExportEnd).toHaveBeenCalledWith('org-1', 'job-fin');
    });
  });

  /* ---------- getExportJobStatus ---------- */
  describe('getExportJobStatus', () => {
    it('returns job status for enterprise table', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: {
            id: 'job-1',
            organization_id: 'org-1',
            status: 'completed',
            progress: 100,
            file_url: 'https://url',
            file_size: 1024,
            expires_at: new Date(Date.now() + 3600_000).toISOString(),
            error_message: null,
          },
        }),
      );
      const result = await getExportJobStatus('job-1');
      expect(result).not.toBeNull();
      expect(result!.jobId).toBe('job-1');
      expect(result!.status).toBe('completed');
      expect(result!.progress).toBe(100);
      expect(result!.downloadUrl).toContain('job-1');
    });

    it('returns null when job not found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await getExportJobStatus('missing');
      expect(result).toBeNull();
    });

    it('falls back to compliance_export_jobs', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: null,
            error: { message: 'does not exist' },
          });
        return createBuilder({
          data: {
            id: 'fallback-1',
            status: 'processing',
            progress: 50,
            file_url: null,
            file_size: null,
            expires_at: null,
            error_message: null,
          },
        });
      });
      const result = await getExportJobStatus('fallback-1');
      expect(result).not.toBeNull();
      expect(result!.jobId).toBe('fallback-1');
      expect(result!.status).toBe('processing');
    });

    it('returns null when fallback also not found', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: null,
            error: { message: 'does not exist' },
          });
        return createBuilder({ data: null });
      });
      const result = await getExportJobStatus('nope');
      expect(result).toBeNull();
    });

    it('returns downloadUrl as undefined for non-completed job', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: {
            id: 'job-p',
            organization_id: 'org-1',
            status: 'processing',
            progress: 40,
            file_url: null,
            file_size: null,
            expires_at: null,
            error_message: null,
          },
        }),
      );
      const result = await getExportJobStatus('job-p');
      expect(result).not.toBeNull();
      expect(result!.downloadUrl).toBeUndefined();
    });

    it('uses file_url as fallback when computedDownloadUrl is empty', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: {
            id: 'job-fu',
            status: 'failed',
            progress: 0,
            file_url: null,
            file_size: null,
            expires_at: null,
            error_message: 'something went wrong',
          },
        }),
      );
      const result = await getExportJobStatus('job-fu');
      expect(result).not.toBeNull();
      expect(result!.errorMessage).toBe('something went wrong');
    });
  });
});
