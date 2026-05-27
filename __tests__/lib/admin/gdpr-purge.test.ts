/**
 * Tests for lib/admin/gdpr-purge.ts (P0-8: GDPR Right-to-Erasure).
 *
 * Exercises the two load-bearing branches:
 *   * sole-owner check refuses the purge with PurgeRefusedError,
 *   * happy-path enqueue + processUserPurge walks the DELETE +
 *     ANONYMIZE table lists, revokes sessions, deletes auth.users,
 *     and writes the final outcome to user_purge_jobs.
 */

jest.mock('server-only', () => ({}));

// ---------------------------------------------------------------------------
// Supabase admin mock — must be hoisted above the import via jest.mock.
// ---------------------------------------------------------------------------

type ChainResult = { data?: any; error?: any; count?: number };

function builder(result: ChainResult = { data: null, error: null, count: 0 }) {
  const b: Record<string, any> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'is',
    'gte',
    'lte',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ];
  for (const m of methods) {
    b[m] = jest.fn(() => b);
  }
  b.then = (resolve: (v: ChainResult) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  // Defined inside the factory so jest's hoisting doesn't TDZ-trap us.
  const deleteUser = jest.fn(async (_id: string) => ({
    data: { user: null },
    error: null,
  }));
  const getUserById = jest.fn(async (_id: string) => ({
    data: {
      user: {
        id: _id,
        email: 'subject@example.com',
        user_metadata: { full_name: 'Subject Name' },
      },
    },
    error: null,
  }));
  const c: Record<string, any> = {
    from: jest.fn(() => builder()),
    auth: { admin: { deleteUser, getUserById } },
  };
  return {
    createSupabaseAdminClient: jest.fn(() => c),
    __admin: c,
    __deleteUser: deleteUser,
    __getUserById: getUserById,
  };
});

// R1: stub the redaction recorder so the GDPR tests don't need a
// real purged_subject_redactions table.
jest.mock('@/lib/audit/redact-purged-subjects', () => ({
  recordSubjectForRedaction: jest.fn().mockResolvedValue(undefined),
  loadRedactor: jest.fn().mockResolvedValue({
    size: 0,
    redactRow: <T>(row: T) => row,
    redactString: (s: string) => s,
    redactValue: <V>(v: V) => v,
  }),
  REDACTION_MARKER: '[redacted-by-erasure-request]',
  buildRedactorFromRows: jest.fn(),
}));

jest.mock('@/lib/auth/session-revocation', () => ({
  revokeAllSessions: jest.fn().mockResolvedValue(new Date()),
  SessionRevokedError: class SessionRevokedError extends Error {},
}));

function getAdmin() {
  return require('@/lib/supabase/admin').__admin;
}
function getDeleteUserMock() {
  return require('@/lib/supabase/admin').__deleteUser;
}

import {
  enqueueUserPurge,
  findSoleOwnedOrgs,
  PurgeRefusedError,
  processUserPurge,
} from '@/lib/admin/gdpr-purge';
import { revokeAllSessions } from '@/lib/auth/session-revocation';

describe('findSoleOwnedOrgs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns [] when the user owns no active orgs', async () => {
    getAdmin().from.mockImplementation(() =>
      builder({ data: [], error: null }),
    );
    const result = await findSoleOwnedOrgs(getAdmin(), 'user-1');
    expect(result).toEqual([]);
  });

  it('returns org-ids the user owns alone (count == 1)', async () => {
    let call = 0;
    getAdmin().from.mockImplementation(() => {
      call += 1;
      // First call: list orgs where user is owner + active.
      if (call === 1) {
        return builder({
          data: [
            { organization_id: 'org-A', organizations: { lifecycle_status: 'active' } },
            { organization_id: 'org-B', organizations: { lifecycle_status: 'active' } },
          ],
          error: null,
        });
      }
      // Second: total owner counts. org-A has 1 owner, org-B has 2.
      return builder({
        data: [
          { organization_id: 'org-A' },
          { organization_id: 'org-B' },
          { organization_id: 'org-B' },
        ],
        error: null,
      });
    });
    const result = await findSoleOwnedOrgs(getAdmin(), 'user-1');
    expect(result).toEqual(['org-A']);
  });
});

describe('enqueueUserPurge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuses with PurgeRefusedError when the user is sole owner', async () => {
    let call = 0;
    getAdmin().from.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return builder({
          data: [
            { organization_id: 'org-A', organizations: { lifecycle_status: 'active' } },
          ],
          error: null,
        });
      }
      if (call === 2) {
        return builder({
          data: [{ organization_id: 'org-A' }],
          error: null,
        });
      }
      // Third call: refusal insert into user_purge_jobs.
      return builder({ data: null, error: null });
    });

    await expect(
      enqueueUserPurge({
        userId: 'user-1',
        requestedBy: 'admin-1',
        reason: 'subject request',
      }),
    ).rejects.toBeInstanceOf(PurgeRefusedError);
  });

  it('inserts a pending job and returns the id', async () => {
    let call = 0;
    getAdmin().from.mockImplementation(() => {
      call += 1;
      // First call: findSoleOwnedOrgs returns empty → short-circuits
      // before the second count query, so the very next call is the
      // user_purge_jobs insert.
      if (call === 1) return builder({ data: [], error: null });
      return builder({ data: { id: 'job-1' }, error: null });
    });

    const result = await enqueueUserPurge({
      userId: 'user-1',
      requestedBy: 'admin-1',
      reason: 'subject request',
    });
    expect(result.jobId).toBe('job-1');
  });
});

describe('processUserPurge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDeleteUserMock().mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  it('runs the cascade, marks the job completed, deletes auth.users', async () => {
    // Mocked from() returns success for every table.
    getAdmin().from.mockImplementation((table: string) => {
      if (table === 'user_purge_jobs') {
        // Sequence: load → claim → final update.
        return builder({
          data: { id: 'job-1', user_id: 'user-1', status: 'pending' },
          error: null,
        });
      }
      return builder({ data: null, error: null, count: 0 });
    });

    const result = await processUserPurge('job-1');

    expect(result.status).toBe('completed');
    expect(getDeleteUserMock()).toHaveBeenCalledWith('user-1');
    expect(revokeAllSessions).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ reason: 'gdpr_purge' }),
    );
    // Every DELETE_TABLES entry recorded.
    expect(result.tableCounts['user_security']).toEqual({
      action: 'delete',
      rows: 0,
    });
    expect(result.tableCounts['org_members']).toEqual({
      action: 'delete',
      rows: 0,
    });
    // Anonymize rules recorded.
    expect(result.tableCounts['comments']).toEqual({
      action: 'anonymize',
      rows: 0,
    });
  });

  it('marks the job failed when auth.users.deleteUser errors', async () => {
    getDeleteUserMock().mockResolvedValue({
      data: null,
      error: { message: 'auth API down' },
    });

    getAdmin().from.mockImplementation((table: string) => {
      if (table === 'user_purge_jobs') {
        return builder({
          data: { id: 'job-1', user_id: 'user-1', status: 'pending' },
          error: null,
        });
      }
      return builder({ data: null, error: null, count: 0 });
    });

    const result = await processUserPurge('job-1');
    expect(result.status).toBe('failed');
  });

  // R1 (Audit 2026-05-27): the capture step is the only window in
  // which we can read the subject's email + full_name; once
  // auth.admin.deleteUser runs the data is gone forever. This test
  // pins the ordering so a refactor doesn't accidentally swap them.
  it('captures subject identifiers BEFORE auth.users delete', async () => {
    const callOrder: string[] = [];
    const recordSubject = require('@/lib/audit/redact-purged-subjects')
      .recordSubjectForRedaction as jest.Mock;
    recordSubject.mockImplementation(async () => {
      callOrder.push('record-subject');
    });
    getDeleteUserMock().mockImplementation(async () => {
      callOrder.push('auth-delete');
      return { data: { user: null }, error: null };
    });
    getAdmin().from.mockImplementation((table: string) => {
      if (table === 'user_purge_jobs') {
        return builder({
          data: { id: 'job-1', user_id: 'user-1', status: 'pending' },
          error: null,
        });
      }
      return builder({ data: null, error: null, count: 0 });
    });

    await processUserPurge('job-1');

    expect(callOrder.indexOf('record-subject')).toBeGreaterThanOrEqual(0);
    expect(callOrder.indexOf('record-subject')).toBeLessThan(
      callOrder.indexOf('auth-delete'),
    );
    expect(recordSubject).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        email: 'subject@example.com',
        fullName: 'Subject Name',
      }),
    );
  });

  it('refuses to claim a job not in pending status', async () => {
    let call = 0;
    getAdmin().from.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return builder({
          data: { id: 'job-1', user_id: 'user-1', status: 'completed' },
          error: null,
        });
      }
      return builder({ data: null, error: null });
    });

    await expect(processUserPurge('job-1')).rejects.toThrow(
      /not pending/i,
    );
  });
});
