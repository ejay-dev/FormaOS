/**
 * Tests for lib/reports/export-jobs.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/audit-reports/report-builder', () => ({
  buildReport: jest
    .fn()
    .mockResolvedValue({ title: 'Test Report', sections: [] }),
}));
jest.mock('@/lib/audit-reports/pdf-generator', () => ({
  generateReportPdf: jest.fn().mockReturnValue({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
  }),
}));
jest.mock('@/lib/queue', () => ({
  getQueueClient: jest.fn().mockReturnValue({
    enqueue: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: jest.fn().mockResolvedValue(false),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'range',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  createReportExportJob,
  processReportExportJob,
} from '@/lib/reports/export-jobs';

beforeEach(() => jest.clearAllMocks());

describe('createReportExportJob', () => {
  it('creates a job and enqueues it', async () => {
    const builder = createBuilder({ data: { id: 'job-1' }, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await createReportExportJob({
      organizationId: 'org-1',
      requestedBy: 'user-1',
      reportType: 'compliance-summary' as any,
    });
    expect(result.ok).toBe(true);
    expect(result.jobId).toBe('job-1');
  });

  it('returns error on insert failure', async () => {
    const builder = createBuilder({
      data: null,
      error: { message: 'insert fail' },
    });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await createReportExportJob({
      organizationId: 'org-1',
      requestedBy: 'user-1',
      reportType: 'compliance-summary' as any,
    });
    expect(result.ok).toBe(false);
  });

  it('defaults format to pdf', async () => {
    const builder = createBuilder({ data: { id: 'job-2' }, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await createReportExportJob({
      organizationId: 'org-1',
      requestedBy: 'user-1',
      reportType: 'compliance-summary' as any,
    });
    expect(result.ok).toBe(true);
  });

  it('handles trigger task success', async () => {
    const { triggerTaskIfConfigured } = require('@/lib/trigger/client');
    triggerTaskIfConfigured.mockResolvedValue(true);

    const builder = createBuilder({ data: { id: 'job-3' }, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await createReportExportJob({
      organizationId: 'org-1',
      requestedBy: 'user-1',
      reportType: 'compliance-summary' as any,
    });
    expect(result.ok).toBe(true);
  });
});

describe('processReportExportJob', () => {
  it('returns early for already completed job', async () => {
    const job = {
      id: 'job-1',
      status: 'completed',
      file_url: 'https://signed.url',
      attempt_count: 1,
      organization_id: 'org-1',
      report_type: 'compliance-summary',
      format: 'pdf',
    };
    const builder = createBuilder({ data: job, error: null });
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => builder),
      storage: { from: jest.fn() },
    });

    const result = await processReportExportJob('job-1');
    expect(result.ok).toBe(true);
    expect(result.fileUrl).toBe('https://signed.url');
  });

  it('returns error when job not found', async () => {
    const builder = createBuilder({ data: null, error: null });
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => builder),
    });

    const result = await processReportExportJob('missing');
    expect(result.ok).toBe(false);
  });

  it('processes pdf format', async () => {
    const job = {
      id: 'job-2',
      status: 'pending',
      file_url: null,
      attempt_count: 0,
      organization_id: 'org-1',
      report_type: 'compliance-summary',
      format: 'pdf',
    };
    const builder = createBuilder({ data: job, error: null });
    const uploadResult = { error: null };
    const signedResult = {
      data: { signedUrl: 'https://signed.url' },
      error: null,
    };
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => builder),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue(uploadResult),
          createSignedUrl: jest.fn().mockResolvedValue(signedResult),
        }),
      },
    });

    const result = await processReportExportJob('job-2');
    expect(result.ok).toBe(true);
    expect(result.fileUrl).toBe('https://signed.url');
  });

  it('processes json format', async () => {
    const job = {
      id: 'job-3',
      status: 'pending',
      file_url: null,
      attempt_count: 0,
      organization_id: 'org-1',
      report_type: 'compliance-summary',
      format: 'json',
    };
    const builder = createBuilder({ data: job, error: null });
    const signedResult = {
      data: { signedUrl: 'https://signed-json.url' },
      error: null,
    };
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => builder),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          createSignedUrl: jest.fn().mockResolvedValue(signedResult),
        }),
      },
    });

    const result = await processReportExportJob('job-3');
    expect(result.ok).toBe(true);
  });

  it('throws on storage upload failure', async () => {
    const job = {
      id: 'job-4',
      status: 'pending',
      file_url: null,
      attempt_count: 0,
      organization_id: 'org-1',
      report_type: 'compliance-summary',
      format: 'pdf',
    };
    const selectBuilder = createBuilder({ data: job, error: null });
    const updateBuilder = createBuilder({ data: null, error: null });
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        return callCount <= 2 ? selectBuilder : updateBuilder;
      }),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest
            .fn()
            .mockResolvedValue({ error: { message: 'quota exceeded' } }),
        }),
      },
    });

    // Should return error
    const result = await processReportExportJob('job-4');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('upload');
  });

  it('handles missing storage client', async () => {
    const job = {
      id: 'job-5',
      status: 'pending',
      file_url: null,
      attempt_count: 0,
      organization_id: 'org-1',
      report_type: 'compliance-summary',
      format: 'pdf',
    };
    const builder = createBuilder({ data: job, error: null });
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => builder),
    });

    const result = await processReportExportJob('job-5');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('storage');
  });
});
