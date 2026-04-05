/**
 * Tests for lib/compliance/evidence-pack-export.ts
 *
 * Exports: createExportJob, processExportJob
 */

jest.mock('server-only', () => ({}));

// ── Supabase mock ────────────────────────────────────────────────────────────

function createBuilder(result = { data: null, error: null }) {
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

const mockUpload = jest.fn().mockResolvedValue({ error: null });
const mockCreateSignedUrl = jest.fn().mockResolvedValue({
  data: { signedUrl: 'https://example.com/signed' },
  error: null,
});

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

// ── Dependency mocks ─────────────────────────────────────────────────────────

jest.mock('@/lib/compliance/snapshot-service', () => ({
  getSnapshotHistory: jest
    .fn()
    .mockResolvedValue([
      { compliance_score: 85, captured_at: '2024-01-01T00:00:00Z' },
    ]),
}));

jest.mock('archiver', () => {
  return jest.fn(() => {
    const EventEmitter = require('events');
    const emitter = new EventEmitter();
    emitter.append = jest.fn();
    emitter.finalize = jest.fn(() => {
      emitter.emit('data', Buffer.from('mock-zip'));
      emitter.emit('end');
    });
    return emitter;
  });
});

jest.mock('@/lib/queue', () => ({
  getQueueClient: jest.fn(() => ({
    enqueue: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  exportLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  createExportJob,
  processExportJob,
} from '@/lib/compliance/evidence-pack-export';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createExportJob', () => {
  it('creates a job and returns jobId on success', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { id: 'job-1' }, error: null }),
    );

    const result = await createExportJob('org-1', 'soc2', 'user-1');

    expect(result.ok).toBe(true);
    expect(result.jobId).toBe('job-1');
  });

  it('returns error when insert fails', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'Insert failed' } }),
    );

    const result = await createExportJob('org-1', 'soc2', 'user-1');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Insert failed');
  });

  it('attempts to trigger task and falls back to queue', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { id: 'job-2' }, error: null }),
    );

    const result = await createExportJob('org-1', 'soc2', 'user-1');
    expect(result.ok).toBe(true);

    const { triggerTaskIfConfigured } = require('@/lib/trigger/client');
    expect(triggerTaskIfConfigured).toHaveBeenCalled();
  });

  it('handles password-protected flag', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { id: 'job-3' }, error: null }),
    );

    const result = await createExportJob('org-1', 'soc2', 'user-1', true);
    expect(result.ok).toBe(true);
  });

  it('handles unexpected exceptions', async () => {
    getClient().from.mockImplementation(() => {
      throw new Error('Connection timeout');
    });

    const result = await createExportJob('org-1', 'soc2', 'user-1');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Connection timeout');
  });
});

describe('processExportJob', () => {
  const mockJob = {
    id: 'job-1',
    organization_id: 'org-1',
    framework_slug: 'soc2',
    requested_by: 'user-1',
    status: 'pending',
    attempt_count: 0,
    file_url: null,
  };

  it('processes a job end-to-end successfully', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      // First call: load job (maybeSingle)
      if (callIdx === 1) return createBuilder({ data: mockJob, error: null });
      // Second call: update status to processing
      if (callIdx === 2) return createBuilder({ data: null, error: null });
      // Framework lookup
      if (callIdx === 3)
        return createBuilder({
          data: { id: 'fw-1', name: 'SOC 2' },
          error: null,
        });
      // Controls, evidence, tasks, policies, automation logs, progress updates, final update
      return createBuilder({ data: [], error: null });
    });

    const result = await processExportJob('job-1');

    expect(result.ok).toBe(true);
    expect(result.fileUrl).toBe('https://example.com/signed');
  });

  it('returns existing URL for already-completed job', async () => {
    const completedJob = {
      ...mockJob,
      status: 'completed',
      file_url: 'https://existing.url/file.zip',
    };

    getClient().from.mockImplementation(() =>
      createBuilder({ data: completedJob, error: null }),
    );

    const result = await processExportJob('job-1');
    expect(result.ok).toBe(true);
    expect(result.fileUrl).toBe('https://existing.url/file.zip');
  });

  it('returns error when job not found', async () => {
    // First call: job lookup (null)
    // Then error handler also calls from()
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const result = await processExportJob('missing-job');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('handles storage upload failure with retry', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1)
        return createBuilder({
          data: { ...mockJob, attempt_count: 1 },
          error: null,
        });
      return createBuilder({ data: [], error: null });
    });

    mockUpload.mockResolvedValueOnce({ error: { message: 'Upload failed' } });

    const result = await processExportJob('job-1', { maxAttempts: 3 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Storage upload failed');
  });

  it('respects preclaimed option', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return createBuilder({ data: mockJob, error: null });
      if (callIdx === 2)
        return createBuilder({
          data: { id: 'fw-1', name: 'SOC 2' },
          error: null,
        });
      return createBuilder({ data: [], error: null });
    });

    const result = await processExportJob('job-1', { preclaimed: true });
    expect(result.ok).toBe(true);
  });
});
