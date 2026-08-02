/** @jest-environment node */
jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn(),
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

/**
 * Records every `from(table)` call alongside the builder returned, so a test
 * can assert which tenant table was mutated (and, for a dry run, that none
 * was). Without this the shared builder swallowed update()/delete() calls
 * silently and the dry-run test could not tell a read-only sweep from a
 * destructive one.
 */
let fromCalls: Array<{ table: string; builder: any }> = [];

function mockFrom(impl: (table: string, index: number) => any) {
  fromCalls = [];
  getClient().from.mockImplementation((table: string) => {
    const builder = impl(table, fromCalls.length);
    fromCalls.push({ table, builder });
    return builder;
  });
}

function tablesTouched() {
  return fromCalls.map((c) => c.table);
}

function buildersFor(table: string) {
  return fromCalls.filter((c) => c.table === table).map((c) => c.builder);
}

function policyRow(overrides: any = {}) {
  return {
    id: 'pol-1',
    org_id: 'org-1',
    document_category: 'tasks',
    retention_period_days: 30,
    action_on_expiry: 'archive',
    is_active: true,
    name: 'custom: tasks',
    description: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

import {
  applyRetentionPolicy,
  listRetentionPolicies,
  evaluateRetention,
  executeRetention,
  BUILT_IN_RETENTION_POLICIES,
} from '@/lib/data-governance/retention';

beforeEach(() => jest.clearAllMocks());

describe('BUILT_IN_RETENTION_POLICIES', () => {
  it('has GDPR and SOC2 policies', () => {
    expect(BUILT_IN_RETENTION_POLICIES.GDPR.length).toBeGreaterThan(0);
    expect(BUILT_IN_RETENTION_POLICIES.SOC2.length).toBeGreaterThan(0);
  });

  it('GDPR policies have correct structure', () => {
    for (const policy of BUILT_IN_RETENTION_POLICIES.GDPR) {
      expect(policy).toHaveProperty('resource_type');
      expect(policy).toHaveProperty('retention_days');
      expect(policy).toHaveProperty('action');
    }
  });
});

describe('applyRetentionPolicy', () => {
  it('upserts retention policy', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          id: 'pol-new',
          org_id: 'org-1',
          document_category: 'tasks',
          retention_period_days: 365,
          action_on_expiry: 'archive',
          is_active: true,
          name: 'custom: tasks',
          description: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    );
    const result = await applyRetentionPolicy('org-1', {
      resource_type: 'tasks',
      retention_days: 365,
      action: 'archive',
    });
    expect(result).toHaveProperty('resource_type', 'tasks');
    expect(getClient().from).toHaveBeenCalledWith('retention_policies');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'upsert fail' } }),
    );
    await expect(
      applyRetentionPolicy('org-1', {
        resource_type: 'tasks',
        retention_days: 30,
        action: 'delete',
      }),
    ).rejects.toThrow('upsert fail');
  });
});

describe('listRetentionPolicies', () => {
  it('returns policies for org', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          {
            id: 'pol-1',
            org_id: 'org-1',
            document_category: 'tasks',
            retention_period_days: 365,
            action_on_expiry: 'archive',
            is_active: true,
            name: 'custom: tasks',
            description: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        error: null,
      }),
    );
    const result = await listRetentionPolicies('org-1');
    expect(result.length).toBe(1);
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'list fail' } }),
    );
    await expect(listRetentionPolicies('org-1')).rejects.toThrow('list fail');
  });
});

describe('evaluateRetention', () => {
  it('evaluates retention for each policy', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        // listRetentionPolicies
        return createBuilder({
          data: [
            {
              id: 'pol-2',
              org_id: 'org-1',
              document_category: 'tasks',
              retention_period_days: 30,
              action_on_expiry: 'archive',
              is_active: true,
              name: 'custom: tasks',
              description: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        });
      }
      // selectExpiredRows
      return createBuilder({
        data: [{ id: 'row-1' }, { id: 'row-2' }],
        error: null,
      });
    });
    const result = await evaluateRetention('org-1');
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('expired_count', 2);
  });
});

describe('executeRetention', () => {
  // Feeds the policy list on the first from() and expired-row data on every
  // subsequent call, so each test only has to describe its policy.
  const mockSweep = (policy: any) =>
    mockFrom((_table, index) =>
      index === 0
        ? createBuilder({ data: [policy], error: null })
        : createBuilder({ data: [{ id: 'r1' }], error: null }),
    );

  // Audit 2026-08-02: this only asserted `result.length === 1`. The shared
  // builder accepted update()/delete() silently, so a dry run that actually
  // archived or deleted tenant rows still passed — for a destructive
  // governance job that is the one thing the test must rule out.
  it('dry run returns results without modifying data', async () => {
    mockSweep(policyRow({ id: 'pol-tasks' }));

    const result = await executeRetention('org-1', true);

    expect(result).toEqual([
      expect.objectContaining({
        org_id: 'org-1',
        resource_type: 'tasks',
        action: 'archive',
        dry_run: true,
        affected_records: ['r1'],
        affected_count: 1,
      }),
    ]);

    // Nothing on the tenant table may be written during a dry run.
    for (const builder of buildersFor('org_tasks')) {
      expect(builder.update).not.toHaveBeenCalled();
      expect(builder.delete).not.toHaveBeenCalled();
    }
    // ...and the org's sweep timestamp is only stamped on a live run.
    expect(tablesTouched()).not.toContain('organizations');
    // The run is still journalled.
    expect(tablesTouched()).toContain('retention_executions');
  });

  it('live run archives rows', async () => {
    mockSweep(policyRow({ id: 'pol-tasks', action_on_expiry: 'archive' }));

    const result = await executeRetention('org-1', false);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ action: 'archive', dry_run: false });

    const archived = buildersFor('org_tasks').filter(
      (b) => b.update.mock.calls.length > 0,
    );
    expect(archived).toHaveLength(1);
    expect(archived[0].update).toHaveBeenCalledWith({ status: 'archived' });
    // Scoped to the caller's org and to the expired ids only.
    expect(archived[0].eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(archived[0].in).toHaveBeenCalledWith('id', ['r1']);
    // Archive must never delete.
    for (const builder of buildersFor('org_tasks')) {
      expect(builder.delete).not.toHaveBeenCalled();
    }
    // Live runs stamp the round-robin cursor for the nightly cron.
    expect(tablesTouched()).toContain('organizations');
  });

  it('live run deletes rows', async () => {
    // 'tasks' -> org_tasks (verified in prod 2026-08-03). The old fixture used
    // document_category 'notifications', whose RESOURCE_CONFIGS entry points at
    // a table named `notifications` that does not exist in production — see
    // the code bug reported alongside this change.
    mockSweep(policyRow({ id: 'pol-tasks', action_on_expiry: 'delete' }));

    const result = await executeRetention('org-1', false);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ action: 'delete', dry_run: false });

    const deleted = buildersFor('org_tasks').filter(
      (b) => b.delete.mock.calls.length > 0,
    );
    expect(deleted).toHaveLength(1);
    expect(deleted[0].eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(deleted[0].in).toHaveBeenCalledWith('id', ['r1']);
  });

  it('does not touch tenant data when a policy has no expired rows', async () => {
    mockFrom((_table, index) =>
      index === 0
        ? createBuilder({
            data: [policyRow({ action_on_expiry: 'delete' })],
            error: null,
          })
        : createBuilder({ data: [], error: null }),
    );

    const result = await executeRetention('org-1', false);

    expect(result[0]).toMatchObject({ affected_count: 0, affected_records: [] });
    for (const builder of buildersFor('org_tasks')) {
      expect(builder.update).not.toHaveBeenCalled();
      expect(builder.delete).not.toHaveBeenCalled();
    }
  });

  // KNOWN DEFECT, pinned deliberately. `toCanonicalPolicy` maps the prod
  // action_on_expiry CHECK values (archive|delete|review) onto the canonical
  // action, and 'review' collapses to 'archive'. There is therefore no input
  // that can produce action === 'anonymize', so `anonymizeRows` is
  // unreachable: an 'anonymize' policy on `evidence` (which has
  // anonymizeFields but no archiveUpdate) writes nothing at all. The old test
  // was named "live run anonymizes rows" and asserted only result.length,
  // which hid that. This asserts what actually happens; when the round-trip
  // is fixed so anonymize survives, this test fails and must be updated with
  // the fix.
  it('does not anonymize — an anonymize policy round-trips as archive and evidence has no archiveUpdate', async () => {
    mockSweep(
      policyRow({
        id: 'pol-evi',
        document_category: 'evidence',
        action_on_expiry: 'archive',
      }),
    );

    const result = await executeRetention('org-1', false);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      resource_type: 'evidence',
      action: 'archive',
    });
    // No update/delete reaches org_evidence: uploaded_by / ai_summary are
    // never nulled, so GDPR anonymisation does not happen today.
    for (const builder of buildersFor('org_evidence')) {
      expect(builder.update).not.toHaveBeenCalled();
      expect(builder.delete).not.toHaveBeenCalled();
    }
  });
});
