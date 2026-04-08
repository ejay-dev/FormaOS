/**
 * Tests for lib/admin/governance.ts
 */

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
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const __admin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => __admin),
}));

jest.mock('@/lib/admin/rbac', () => ({
  resolvePlatformAdminPermissions: jest.fn(
    ({ role, customPermissions }: any) => {
      if (
        customPermissions &&
        Array.isArray(customPermissions) &&
        customPermissions.length > 0
      ) {
        return customPermissions;
      }
      const defaults: Record<string, string[]> = {
        super_admin: ['all'],
        admin: ['read', 'write'],
        viewer: ['read'],
      };
      return defaults[role] ?? [];
    },
  ),
}));

import {
  getPlatformAdminAssignment,
  listPlatformAdminAssignments,
  upsertPlatformAdminAssignment,
  listPlatformChangeApprovals,
  createPlatformChangeApproval,
  updatePlatformChangeApprovalStatus,
  consumeApprovedPlatformChange,
} from '@/lib/admin/governance';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPlatformAdminAssignment', () => {
  it('returns null when no assignment found', async () => {
    __admin.from = jest.fn(() => createBuilder({ data: null, error: null }));
    const result = await getPlatformAdminAssignment('user-1');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    const result = await getPlatformAdminAssignment('user-1');
    expect(result).toBeNull();
  });

  it('returns normalized assignment on success', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'a1',
          user_id: 'user-1',
          email: 'admin@test.com',
          role_key: 'super_admin',
          permissions: [],
          is_active: true,
          created_by: 'creator',
          updated_by: 'updater',
          reason: 'initial setup',
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
        },
        error: null,
      }),
    );

    const result = await getPlatformAdminAssignment('user-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('a1');
    expect(result!.email).toBe('admin@test.com');
    expect(result!.role_key).toBe('super_admin');
    expect(result!.is_active).toBe(true);
    expect(result!.reason).toBe('initial setup');
  });

  it('normalizes missing email to null', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'a2',
          user_id: 'user-2',
          email: 123, // not a string
          role_key: 'viewer',
          permissions: [],
          is_active: true,
          created_by: null,
          updated_by: null,
          reason: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
        },
        error: null,
      }),
    );

    const result = await getPlatformAdminAssignment('user-2');
    expect(result!.email).toBeNull();
    expect(result!.created_by).toBeNull();
    expect(result!.reason).toBe('');
  });
});

describe('listPlatformAdminAssignments', () => {
  it('returns empty array when no data', async () => {
    __admin.from = jest.fn(() => createBuilder({ data: null, error: null }));
    const result = await listPlatformAdminAssignments();
    expect(result).toEqual([]);
  });

  it('returns normalized assignments', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: 'a1',
            user_id: 'u1',
            email: 'a@b.com',
            role_key: 'admin',
            permissions: [],
            is_active: true,
            created_by: 'c1',
            updated_by: 'c1',
            reason: 'test',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
        error: null,
      }),
    );

    const result = await listPlatformAdminAssignments();
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('u1');
  });
});

describe('upsertPlatformAdminAssignment', () => {
  it('returns normalized assignment on success', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'a3',
          user_id: 'user-3',
          email: 'new@test.com',
          role_key: 'admin',
          permissions: ['read', 'write'],
          is_active: true,
          created_by: 'actor-1',
          updated_by: 'actor-1',
          reason: 'promotion',
          created_at: '2024-06-01',
          updated_at: '2024-06-01',
        },
        error: null,
      }),
    );

    const result = await upsertPlatformAdminAssignment({
      actorUserId: 'actor-1',
      userId: 'user-3',
      email: 'new@test.com',
      roleKey: 'admin' as any,
      reason: 'promotion',
    });

    expect(result.id).toBe('a3');
    expect(result.role_key).toBe('admin');
  });

  it('throws on error', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: null, error: { message: 'conflict' } }),
    );

    await expect(
      upsertPlatformAdminAssignment({
        actorUserId: 'a',
        userId: 'b',
        roleKey: 'admin' as any,
        reason: 'x',
      }),
    ).rejects.toEqual({ message: 'conflict' });
  });
});

describe('listPlatformChangeApprovals', () => {
  it('returns empty array when no data', async () => {
    __admin.from = jest.fn(() => createBuilder({ data: null, error: null }));
    const result = await listPlatformChangeApprovals();
    expect(result).toEqual([]);
  });

  it('returns normalized approvals with null fields', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: 'ap1',
            action: 'org_retire',
            target_type: 'organization',
            target_id: null,
            requested_for_user_id: 'u1',
            requested_by: 'actor1',
            approver_user_id: null,
            status: 'pending',
            reason: 'cleanup',
            metadata: { key: 'value' },
            expires_at: null,
            approved_at: null,
            rejected_at: null,
            consumed_at: null,
            created_at: '2024-06-01',
            updated_at: '2024-06-01',
          },
        ],
        error: null,
      }),
    );

    const result = await listPlatformChangeApprovals();
    expect(result).toHaveLength(1);
    expect(result[0].target_id).toBeNull();
    expect(result[0].approver_user_id).toBeNull();
    expect(result[0].metadata).toEqual({ key: 'value' });
  });

  it('normalizes non-object metadata to empty object', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: 'ap2',
            action: 'test',
            target_type: 'test',
            target_id: 't1',
            requested_for_user_id: 'u1',
            requested_by: null,
            approver_user_id: null,
            status: 'approved',
            reason: null,
            metadata: 'invalid', // not an object
            expires_at: '2024-12-31',
            approved_at: '2024-06-01',
            rejected_at: null,
            consumed_at: null,
            created_at: '2024-06-01',
            updated_at: '2024-06-01',
          },
        ],
        error: null,
      }),
    );

    const result = await listPlatformChangeApprovals();
    expect(result[0].metadata).toEqual({});
    expect(result[0].reason).toBe('');
  });

  it('normalizes array metadata to empty object', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: 'ap3',
            action: 'test',
            target_type: 'test',
            target_id: null,
            requested_for_user_id: 'u1',
            requested_by: null,
            approver_user_id: null,
            status: 'pending',
            reason: 'x',
            metadata: [1, 2, 3], // array, not plain object
            expires_at: null,
            approved_at: null,
            rejected_at: null,
            consumed_at: null,
            created_at: '2024-06-01',
            updated_at: '2024-06-01',
          },
        ],
        error: null,
      }),
    );

    const result = await listPlatformChangeApprovals();
    expect(result[0].metadata).toEqual({});
  });
});

describe('createPlatformChangeApproval', () => {
  it('creates approval with approved status by default', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'ap-new',
          action: 'org_lock',
          target_type: 'organization',
          target_id: 'org-1',
          requested_for_user_id: 'u1',
          requested_by: 'actor1',
          approver_user_id: 'actor1',
          status: 'approved',
          reason: 'security concern',
          metadata: {},
          expires_at: null,
          approved_at: '2024-06-01',
          rejected_at: null,
          consumed_at: null,
          created_at: '2024-06-01',
          updated_at: '2024-06-01',
        },
        error: null,
      }),
    );

    const result = await createPlatformChangeApproval({
      actorUserId: 'actor1',
      requestedForUserId: 'u1',
      action: 'org_lock',
      targetType: 'organization',
      targetId: 'org-1',
      reason: 'security concern',
    });

    expect(result.status).toBe('approved');
    expect(result.approver_user_id).toBe('actor1');
  });

  it('creates pending approval when status specified', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'ap-pending',
          action: 'trial_reset',
          target_type: 'subscription',
          target_id: null,
          requested_for_user_id: 'u2',
          requested_by: 'actor2',
          approver_user_id: null,
          status: 'pending',
          reason: 'customer request',
          metadata: { ticket: 'T-123' },
          expires_at: null,
          approved_at: null,
          rejected_at: null,
          consumed_at: null,
          created_at: '2024-06-01',
          updated_at: '2024-06-01',
        },
        error: null,
      }),
    );

    const result = await createPlatformChangeApproval({
      actorUserId: 'actor2',
      requestedForUserId: 'u2',
      action: 'trial_reset',
      targetType: 'subscription',
      reason: 'customer request',
      status: 'pending',
      metadata: { ticket: 'T-123' },
    });

    expect(result.status).toBe('pending');
    expect(result.approver_user_id).toBeNull();
  });

  it('throws on error', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: null, error: { message: 'insert failed' } }),
    );

    await expect(
      createPlatformChangeApproval({
        actorUserId: 'a',
        requestedForUserId: 'b',
        action: 'x',
        targetType: 'y',
        reason: 'z',
      }),
    ).rejects.toEqual({ message: 'insert failed' });
  });
});

describe('updatePlatformChangeApprovalStatus', () => {
  it('sets approved fields on approved status', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'ap1',
          action: 'test',
          target_type: 'org',
          target_id: null,
          requested_for_user_id: 'u1',
          requested_by: 'a1',
          approver_user_id: 'actor1',
          status: 'approved',
          reason: 'ok',
          metadata: {},
          expires_at: null,
          approved_at: '2024-06-01',
          rejected_at: null,
          consumed_at: null,
          created_at: '2024-01-01',
          updated_at: '2024-06-01',
        },
        error: null,
      }),
    );

    const result = await updatePlatformChangeApprovalStatus({
      actorUserId: 'actor1',
      approvalId: 'ap1',
      status: 'approved',
    });

    expect(result.status).toBe('approved');
    expect(result.approved_at).not.toBeNull();
  });

  it('sets rejected fields on rejected status', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'ap1',
          action: 'test',
          target_type: 'org',
          target_id: null,
          requested_for_user_id: 'u1',
          requested_by: 'a1',
          approver_user_id: 'actor1',
          status: 'rejected',
          reason: 'denied',
          metadata: {},
          expires_at: null,
          approved_at: null,
          rejected_at: '2024-06-01',
          consumed_at: null,
          created_at: '2024-01-01',
          updated_at: '2024-06-01',
        },
        error: null,
      }),
    );

    const result = await updatePlatformChangeApprovalStatus({
      actorUserId: 'actor1',
      approvalId: 'ap1',
      status: 'rejected',
    });

    expect(result.status).toBe('rejected');
    expect(result.rejected_at).not.toBeNull();
  });

  it('sets consumed_at on consumed status', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: {
          id: 'ap1',
          action: 'test',
          target_type: 'org',
          target_id: null,
          requested_for_user_id: 'u1',
          requested_by: 'a1',
          approver_user_id: null,
          status: 'consumed',
          reason: '',
          metadata: {},
          expires_at: null,
          approved_at: null,
          rejected_at: null,
          consumed_at: '2024-06-01',
          created_at: '2024-01-01',
          updated_at: '2024-06-01',
        },
        error: null,
      }),
    );

    const result = await updatePlatformChangeApprovalStatus({
      actorUserId: 'actor1',
      approvalId: 'ap1',
      status: 'consumed',
    });

    expect(result.status).toBe('consumed');
    expect(result.consumed_at).not.toBeNull();
  });

  it('throws on error', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: null, error: { message: 'not found' } }),
    );

    await expect(
      updatePlatformChangeApprovalStatus({
        actorUserId: 'a',
        approvalId: 'x',
        status: 'approved',
      }),
    ).rejects.toEqual({ message: 'not found' });
  });
});

describe('consumeApprovedPlatformChange', () => {
  it('returns null when no matching approval found', async () => {
    __admin.from = jest.fn(() => createBuilder({ data: [], error: null }));

    const result = await consumeApprovedPlatformChange({
      userId: 'u1',
      action: 'org_lock',
      targetType: 'organization',
    });

    expect(result).toBeNull();
  });

  it('matches approval with wildcard target_type', async () => {
    let callCount = 0;
    __admin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: [
            {
              id: 'ap-match',
              action: 'org_lock',
              target_type: '*',
              target_id: null,
              requested_for_user_id: 'u1',
              requested_by: 'a1',
              approver_user_id: 'a1',
              status: 'approved',
              reason: 'master',
              metadata: {},
              expires_at: null,
              approved_at: '2024-06-01',
              rejected_at: null,
              consumed_at: null,
              created_at: '2024-06-01',
              updated_at: '2024-06-01',
            },
          ],
          error: null,
        });
      }
      // Update call
      return createBuilder({
        data: {
          id: 'ap-match',
          action: 'org_lock',
          target_type: '*',
          target_id: null,
          requested_for_user_id: 'u1',
          requested_by: 'a1',
          approver_user_id: 'a1',
          status: 'consumed',
          reason: 'master',
          metadata: {},
          expires_at: null,
          approved_at: '2024-06-01',
          rejected_at: null,
          consumed_at: '2024-06-02',
          created_at: '2024-06-01',
          updated_at: '2024-06-02',
        },
        error: null,
      });
    });

    const result = await consumeApprovedPlatformChange({
      userId: 'u1',
      action: 'org_lock',
      targetType: 'organization',
      targetId: 'org-123',
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('consumed');
  });

  it('matches approval with exact target_type and wildcard target_id', async () => {
    let callCount = 0;
    __admin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: [
            {
              id: 'ap-exact',
              action: 'org_lock',
              target_type: 'organization',
              target_id: '*',
              requested_for_user_id: 'u1',
              requested_by: 'a1',
              approver_user_id: 'a1',
              status: 'approved',
              reason: 'specific',
              metadata: {},
              expires_at: null,
              approved_at: '2024-06-01',
              rejected_at: null,
              consumed_at: null,
              created_at: '2024-06-01',
              updated_at: '2024-06-01',
            },
          ],
          error: null,
        });
      }
      return createBuilder({
        data: {
          id: 'ap-exact',
          action: 'org_lock',
          target_type: 'organization',
          target_id: '*',
          requested_for_user_id: 'u1',
          requested_by: 'a1',
          approver_user_id: 'a1',
          status: 'consumed',
          reason: 'specific',
          metadata: {},
          expires_at: null,
          approved_at: '2024-06-01',
          rejected_at: null,
          consumed_at: '2024-06-02',
          created_at: '2024-06-01',
          updated_at: '2024-06-02',
        },
        error: null,
      });
    });

    const result = await consumeApprovedPlatformChange({
      userId: 'u1',
      action: 'org_lock',
      targetType: 'organization',
    });

    expect(result).not.toBeNull();
  });

  it('skips expired approvals', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: 'ap-expired',
            action: 'org_lock',
            target_type: 'organization',
            target_id: null,
            requested_for_user_id: 'u1',
            requested_by: 'a1',
            approver_user_id: 'a1',
            status: 'approved',
            reason: 'old',
            metadata: {},
            expires_at: '2020-01-01T00:00:00Z', // expired
            approved_at: '2020-01-01',
            rejected_at: null,
            consumed_at: null,
            created_at: '2020-01-01',
            updated_at: '2020-01-01',
          },
        ],
        error: null,
      }),
    );

    const result = await consumeApprovedPlatformChange({
      userId: 'u1',
      action: 'org_lock',
      targetType: 'organization',
    });

    expect(result).toBeNull();
  });

  it('returns null on update error', async () => {
    let callCount = 0;
    __admin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: [
            {
              id: 'ap-fail-update',
              action: 'org_lock',
              target_type: 'organization',
              target_id: null,
              requested_for_user_id: 'u1',
              requested_by: 'a1',
              approver_user_id: 'a1',
              status: 'approved',
              reason: 'test',
              metadata: {},
              expires_at: null,
              approved_at: '2024-06-01',
              rejected_at: null,
              consumed_at: null,
              created_at: '2024-06-01',
              updated_at: '2024-06-01',
            },
          ],
          error: null,
        });
      }
      // Update fails
      return createBuilder({ data: null, error: { message: 'conflict' } });
    });

    const result = await consumeApprovedPlatformChange({
      userId: 'u1',
      action: 'org_lock',
      targetType: 'organization',
    });

    expect(result).toBeNull();
  });
});
