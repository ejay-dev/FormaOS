/**
 * @jest-environment node
 */

/* ------------------------------------------------------------------ */
/*  Supabase builder helper                                           */
/* ------------------------------------------------------------------ */
function createBuilder(
  result: { data?: any; error?: any } = { data: null, error: null },
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

jest.mock('@/lib/audit-reports/report-builder', () => ({
  buildReport: jest.fn().mockResolvedValue({ title: 'report' }),
}));

jest.mock('@/lib/audit-reports/pdf-generator', () => ({
  generateReportPdf: jest.fn().mockReturnValue(new Blob(['pdf'])),
}));

jest.mock('@/lib/queue', () => ({
  getQueueClient: jest.fn(() => ({
    enqueue: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/users/admin-profile-directory', () => ({
  getAdminProfileDirectoryEntries: jest.fn().mockResolvedValue([]),
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
    it('creates a job and returns jobId', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'job-1' } }),
      );
      const result = await createEnterpriseExportJob('org-1', 'user-1', {
        includeCompliance: true,
        includeEvidence: true,
        includeAuditLogs: true,
        includeCareOps: true,
        includeTeam: true,
      });
      expect(result.ok).toBe(true);
      expect(result.jobId).toBe('job-1');
    });

    it('returns error when throttled', async () => {
      mockCanStartExport.mockResolvedValue({
        allowed: false,
        reason: 'Rate limited',
      });
      const result = await createEnterpriseExportJob('org-1', 'user-1', {
        includeCompliance: true,
        includeEvidence: false,
        includeAuditLogs: false,
        includeCareOps: false,
        includeTeam: false,
      });
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
      const result = await createEnterpriseExportJob('org-1', 'user-1', {
        includeCompliance: true,
        includeEvidence: false,
        includeAuditLogs: false,
        includeCareOps: false,
        includeTeam: false,
      });
      expect(result.ok).toBe(true);
      expect(result.jobId).toBe('fallback-1');
    });

    it('returns error on db insert failure', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'db error' } }),
      );
      const result = await createEnterpriseExportJob('org-1', 'user-1', {
        includeCompliance: true,
        includeEvidence: false,
        includeAuditLogs: false,
        includeCareOps: false,
        includeTeam: false,
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('db error');
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

    it('returns existing URL for already completed job', async () => {
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
  });
});
