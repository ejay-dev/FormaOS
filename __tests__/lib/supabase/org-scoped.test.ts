/**
 * Tests for lib/supabase/org-scoped.ts
 *
 * The wrapper is safety-critical: it turns "remember to filter by org" into
 * a structural guarantee for tenant tables. These tests verify each invariant:
 *
 *   1. select reads pass through with the org-eq filter appended.
 *   2. insert payloads are stamped with the registered orgColumn.
 *   3. update payloads are stamped AND filtered, with caller-supplied
 *      orgColumn stripped (defense against accidentally moving rows
 *      across tenants).
 *   4. upsert payloads are stamped — no trailing filter (PostgREST
 *      UPSERT doesn't honor filters anyway).
 *   5. delete operations are filtered by the registered orgColumn.
 *   6. Tables not in the TENANT_TABLE_SCOPES registry throw at runtime.
 *   7. Empty / falsy orgId throws at construction.
 *   8. unsafeAdmin() escape-hatch returns the underlying admin client.
 *   9. rpc / storage / auth passthroughs are lazy and tolerate minimal
 *      admin-client mocks.
 */

jest.mock('server-only', () => ({}));

// Build a controllable admin mock: every PostgREST verb returns a
// chainable proxy whose calls land in a shared `recorded` array so the
// test can inspect what the wrapper actually emitted.
type Recorded = { kind: string; args: unknown[]; table?: string };

const recorded: Recorded[] = [];

function makeBuilder(table: string) {
  const builder = {
    select: jest.fn((...args: unknown[]) => {
      recorded.push({ kind: 'select', args, table });
      return builder;
    }),
    insert: jest.fn((...args: unknown[]) => {
      recorded.push({ kind: 'insert', args, table });
      return builder;
    }),
    update: jest.fn((...args: unknown[]) => {
      recorded.push({ kind: 'update', args, table });
      return builder;
    }),
    upsert: jest.fn((...args: unknown[]) => {
      recorded.push({ kind: 'upsert', args, table });
      return builder;
    }),
    delete: jest.fn(() => {
      recorded.push({ kind: 'delete', args: [], table });
      return builder;
    }),
    eq: jest.fn((...args: unknown[]) => {
      recorded.push({ kind: 'eq', args, table });
      return builder;
    }),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    limit: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
  };
  return builder;
}

const fromMock = jest.fn((table: string) => makeBuilder(table));
const adminClient = {
  from: fromMock,
  rpc: jest.fn(),
  storage: { from: jest.fn() },
  auth: { admin: { getUserById: jest.fn() } },
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => adminClient,
}));

import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';

const ORG = 'org-uuid-123';

beforeEach(() => {
  recorded.length = 0;
  fromMock.mockClear();
});

describe('createSupabaseOrgClient — construction', () => {
  it('throws when orgId is empty string', () => {
    expect(() => createSupabaseOrgClient('')).toThrow(/orgId is required/i);
  });

  it('throws when orgId is undefined (cast)', () => {
    // @ts-expect-error — testing runtime guard
    expect(() => createSupabaseOrgClient(undefined)).toThrow(
      /orgId is required/i,
    );
  });

  it('does not throw on a non-empty orgId', () => {
    expect(() => createSupabaseOrgClient(ORG)).not.toThrow();
  });
});

describe('createSupabaseOrgClient — table registry', () => {
  it('throws when calling .from() on an unregistered table', () => {
    const sb = createSupabaseOrgClient(ORG);
    expect(() => sb.from('totally_made_up_table')).toThrow(
      /not registered as a tenant table/,
    );
  });

  it('allows a registered table with organization_id column', () => {
    const sb = createSupabaseOrgClient(ORG);
    expect(() => sb.from('org_tasks')).not.toThrow();
  });

  it('allows a registered table with org_id column', () => {
    const sb = createSupabaseOrgClient(ORG);
    expect(() => sb.from('org_files')).not.toThrow();
  });
});

describe('createSupabaseOrgClient — select', () => {
  it('appends .eq(organization_id, orgId) automatically', async () => {
    const sb = createSupabaseOrgClient(ORG);
    await sb.from('org_tasks').select('id').maybeSingle();

    const eqCalls = recorded.filter((r) => r.kind === 'eq');
    expect(eqCalls).toHaveLength(1);
    expect(eqCalls[0].args).toEqual(['organization_id', ORG]);
  });

  it('appends .eq(org_id, orgId) for tables registered with org_id', async () => {
    const sb = createSupabaseOrgClient(ORG);
    await sb.from('org_files').select('id').maybeSingle();

    const eqCalls = recorded.filter((r) => r.kind === 'eq');
    expect(eqCalls).toHaveLength(1);
    expect(eqCalls[0].args).toEqual(['org_id', ORG]);
  });

  it('preserves count/head opts on select', async () => {
    const sb = createSupabaseOrgClient(ORG);
    await sb.from('org_tasks').select('id', { count: 'exact', head: true });

    const selectCall = recorded.find((r) => r.kind === 'select');
    expect(selectCall?.args[0]).toBe('id');
    expect(selectCall?.args[1]).toEqual({ count: 'exact', head: true });
  });
});

describe('createSupabaseOrgClient — insert', () => {
  it('stamps the organization_id column on a single payload', () => {
    const sb = createSupabaseOrgClient(ORG);
    sb.from('org_tasks').insert({ title: 'hello' });

    const insertCall = recorded.find((r) => r.kind === 'insert');
    expect(insertCall?.args[0]).toEqual({
      title: 'hello',
      organization_id: ORG,
    });
  });

  it('stamps every row in an array payload', () => {
    const sb = createSupabaseOrgClient(ORG);
    sb.from('org_tasks').insert([{ title: 'a' }, { title: 'b' }]);

    const insertCall = recorded.find((r) => r.kind === 'insert');
    expect(insertCall?.args[0]).toEqual([
      { title: 'a', organization_id: ORG },
      { title: 'b', organization_id: ORG },
    ]);
  });

  it('overrides a caller-supplied (wrong) organization_id with the bound orgId', () => {
    const sb = createSupabaseOrgClient(ORG);
    sb.from('org_tasks').insert({
      title: 'attacker-shaped',
      organization_id: 'some-other-org',
    });

    const insertCall = recorded.find((r) => r.kind === 'insert');
    expect((insertCall?.args[0] as { organization_id: string }).organization_id).toBe(ORG);
  });
});

describe('createSupabaseOrgClient — update', () => {
  it('strips orgColumn from the payload and appends .eq filter', () => {
    const sb = createSupabaseOrgClient(ORG);
    sb.from('org_tasks').update({
      title: 'updated',
      organization_id: 'attacker-attempt',
    });

    const updateCall = recorded.find((r) => r.kind === 'update');
    expect(updateCall?.args[0]).toEqual({ title: 'updated' });
    // No organization_id leaked into the payload.
    expect(
      (updateCall?.args[0] as Record<string, unknown>).organization_id,
    ).toBeUndefined();

    const eqCalls = recorded.filter((r) => r.kind === 'eq');
    expect(eqCalls[0].args).toEqual(['organization_id', ORG]);
  });
});

describe('createSupabaseOrgClient — upsert', () => {
  it('stamps the orgColumn on every row but does NOT append a trailing .eq', () => {
    const sb = createSupabaseOrgClient(ORG);
    sb.from('org_entitlements').upsert(
      [
        { feature_key: 'a', enabled: true },
        { feature_key: 'b', enabled: false },
      ],
      { onConflict: 'organization_id,feature_key' },
    );

    const upsertCall = recorded.find((r) => r.kind === 'upsert');
    expect(upsertCall?.args[0]).toEqual([
      { feature_key: 'a', enabled: true, organization_id: ORG },
      { feature_key: 'b', enabled: false, organization_id: ORG },
    ]);
    expect(upsertCall?.args[1]).toEqual({
      onConflict: 'organization_id,feature_key',
    });

    // No .eq() should follow an upsert.
    expect(recorded.filter((r) => r.kind === 'eq')).toHaveLength(0);
  });
});

describe('createSupabaseOrgClient — delete', () => {
  it('appends the orgColumn filter to the delete', () => {
    const sb = createSupabaseOrgClient(ORG);
    sb.from('org_tasks').delete().eq('id', 'some-task-id');

    const deleteCall = recorded.find((r) => r.kind === 'delete');
    expect(deleteCall).toBeDefined();

    const eqCalls = recorded.filter((r) => r.kind === 'eq');
    // The wrapper's auto-eq + the caller's explicit .eq('id', ...) both record.
    expect(eqCalls).toHaveLength(2);
    expect(eqCalls[0].args).toEqual(['organization_id', ORG]);
    expect(eqCalls[1].args).toEqual(['id', 'some-task-id']);
  });
});

describe('createSupabaseOrgClient — escape hatches', () => {
  it('unsafeAdmin() returns the underlying admin client', () => {
    const sb = createSupabaseOrgClient(ORG);
    expect(sb.unsafeAdmin()).toBe(adminClient);
  });

  it('passes auth through to the admin client (lazy)', () => {
    const sb = createSupabaseOrgClient(ORG);
    expect(sb.auth).toBe(adminClient.auth);
  });

  it('passes storage through to the admin client (lazy)', () => {
    const sb = createSupabaseOrgClient(ORG);
    expect(sb.storage).toBe(adminClient.storage);
  });
});
