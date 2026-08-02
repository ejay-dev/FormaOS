/** @jest-environment node */

import { resolveActiveMembership } from '@/lib/auth/membership-cache';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

// Minimal Supabase mock — only the methods our resolver touches.
type Row = { organization_id: string; role: string | null };

function makeSupabaseMock(opts: {
  user: { id: string } | null;
  memberships: Row[];
  preferredOrgId?: string | null;
  membershipError?: Error | null;
}): {
  client: Parameters<typeof resolveActiveMembership>[0];
  calls: { tables: string[] };
} {
  const calls = { tables: [] as string[] };

  const fromImpl = (table: string) => {
    calls.tables.push(table);
    if (table === 'org_members') {
      // Chainable + thenable: the resolvers append
      // .or('compliance_status.is.null,compliance_status.neq.inactive') after
      // .eq(), so a mock that resolves straight off .eq() would throw on .or
      // and mask the deprovisioning filter entirely.
      const result = {
        data: opts.membershipError ? null : opts.memberships,
        error: opts.membershipError ?? null,
      };
      const chain: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'or', 'limit', 'order', 'in']) {
        chain[method] = () => chain;
      }
      chain.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve(result).then(resolve);
      return chain;
    }
    if (table === 'user_preferences') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data:
                  opts.preferredOrgId === undefined
                    ? null
                    : { current_organization_id: opts.preferredOrgId },
                error: null,
              }),
          }),
        }),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  };

  const client = {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: opts.user as unknown },
          error: null,
        }),
    },
    from: fromImpl,
  } as unknown as Parameters<typeof resolveActiveMembership>[0];

  return { client, calls };
}

describe('resolveActiveMembership', () => {
  it('returns unauthorized when no user', async () => {
    const { client } = makeSupabaseMock({ user: null, memberships: [] });
    const r = await resolveActiveMembership(client);
    expect(r.kind).toBe('unauthorized');
  });

  it('returns none when user has zero memberships', async () => {
    const { client } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [],
    });
    const r = await resolveActiveMembership(client);
    expect(r.kind).toBe('none');
  });

  it('returns ok for a single-membership user (no preference needed)', async () => {
    const { client, calls } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [{ organization_id: 'org-a', role: 'admin' }],
    });
    const r = await resolveActiveMembership(client);
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') {
      expect(r.organizationId).toBe('org-a');
      expect(r.role).toBe('admin');
    }
    // Should NOT have queried user_preferences for a single-org user.
    expect(calls.tables).not.toContain('user_preferences');
  });

  it('returns ambiguous for multi-org user with no preference', async () => {
    const { client } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [
        { organization_id: 'org-a', role: 'owner' },
        { organization_id: 'org-b', role: 'member' },
      ],
      preferredOrgId: null,
    });
    const r = await resolveActiveMembership(client);
    expect(r.kind).toBe('ambiguous');
    if (r.kind === 'ambiguous') {
      expect(r.memberships).toHaveLength(2);
    }
  });

  it('returns ok for multi-org user with valid preference', async () => {
    const { client } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [
        { organization_id: 'org-a', role: 'owner' },
        { organization_id: 'org-b', role: 'member' },
      ],
      preferredOrgId: 'org-b',
    });
    const r = await resolveActiveMembership(client);
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') {
      expect(r.organizationId).toBe('org-b');
      expect(r.role).toBe('member');
    }
  });

  it('returns ambiguous when preference points to a non-membership', async () => {
    // Defends against stale preferences after a user is removed
    // from an org — we MUST NOT silently fall through to "first row".
    const { client } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [
        { organization_id: 'org-a', role: 'owner' },
        { organization_id: 'org-b', role: 'member' },
      ],
      preferredOrgId: 'org-deleted',
    });
    const r = await resolveActiveMembership(client);
    expect(r.kind).toBe('ambiguous');
  });
});

describe('requireActiveOrgContext', () => {
  it('returns ok payload for unambiguous orgs', async () => {
    const { client } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [{ organization_id: 'org-a', role: 'admin' }],
    });
    const ctx = await requireActiveOrgContext(client);
    expect(ctx.ok).toBe(true);
    if (ctx.ok) {
      expect(ctx.userId).toBe('u1');
      expect(ctx.orgId).toBe('org-a');
      expect(ctx.role).toBe('admin');
    }
  });

  it('returns 401 response for unauthorized', async () => {
    const { client } = makeSupabaseMock({ user: null, memberships: [] });
    const ctx = await requireActiveOrgContext(client);
    expect(ctx.ok).toBe(false);
    if (!ctx.ok) expect(ctx.response.status).toBe(401);
  });

  it('returns 400 response for users with no orgs', async () => {
    const { client } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [],
    });
    const ctx = await requireActiveOrgContext(client);
    expect(ctx.ok).toBe(false);
    if (!ctx.ok) expect(ctx.response.status).toBe(400);
  });

  it('returns 409 with memberships list when ambiguous', async () => {
    const { client } = makeSupabaseMock({
      user: { id: 'u1' },
      memberships: [
        { organization_id: 'org-a', role: 'owner' },
        { organization_id: 'org-b', role: 'member' },
      ],
      preferredOrgId: null,
    });
    const ctx = await requireActiveOrgContext(client);
    expect(ctx.ok).toBe(false);
    if (!ctx.ok) {
      expect(ctx.response.status).toBe(409);
      const body = await ctx.response.json();
      expect(body.error).toBe('active_org_required');
      expect(body.memberships).toHaveLength(2);
    }
  });
});
