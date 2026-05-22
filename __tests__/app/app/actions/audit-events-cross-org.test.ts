/** @jest-environment node */
/**
 * Regression test for audit server-actions-003 (2026-05-22 deep audit).
 *
 * Before this fix, `logAuditEvent` and `logActivity` were exported from
 * 'use server' files and accepted `organizationId` from the caller with
 * no membership check. Any authed user could inject events into any
 * tenant's audit trail with a spoofed actor identity — and the
 * admin-client fallback in `logAuditEvent` made the forgery RLS-proof.
 *
 * The fix adds an early `assertCallerOwnsOrg` style guard that compares
 * the caller's session-derived org membership against the payload's
 * `organizationId`. This test verifies both rejection (cross-org) and
 * acceptance (own-org).
 */

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/lib/audit/org-audit-log', () => ({
  insertOrgAuditLog: jest.fn(),
}));

jest.mock('@/app/app/actions/rbac', () => ({
  getUserOrgMembership: jest.fn(),
}));

import { getUserOrgMembership } from '@/app/app/actions/rbac';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { logActivity } from '@/app/app/actions/audit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const mockGetMembership = getUserOrgMembership as jest.MockedFunction<
  typeof getUserOrgMembership
>;
const mockInsertOrgAuditLog = insertOrgAuditLog as jest.MockedFunction<
  typeof insertOrgAuditLog
>;
const mockServerClient = createSupabaseServerClient as jest.Mock;
const mockAdminClient = createSupabaseAdminClient as jest.Mock;

describe('logAuditEvent cross-org guard (audit server-actions-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServerClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-A', email: 'a@example.com' } },
          error: null,
        }),
      },
    });
    mockAdminClient.mockReturnValue({});
    mockInsertOrgAuditLog.mockResolvedValue({ data: null, error: null });
  });

  it('rejects when caller-session org does NOT match payload.organizationId', async () => {
    mockGetMembership.mockResolvedValue({
      orgId: 'org-A',
      role: 'OWNER' as never,
      userId: 'user-A',
    });

    const result = await logAuditEvent({
      organizationId: 'org-VICTIM',
      actorUserId: 'user-A',
      actorRole: 'OWNER',
      actionType: 'POLICY_DELETED',
    });

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/Access denied/i),
    });
    // No DB write attempted — neither user-scoped nor admin-fallback.
    expect(mockInsertOrgAuditLog).not.toHaveBeenCalled();
  });

  it('throws when caller-session org does NOT match payload.organizationId and required=true', async () => {
    mockGetMembership.mockResolvedValue({
      orgId: 'org-A',
      role: 'OWNER' as never,
      userId: 'user-A',
    });

    await expect(
      logAuditEvent(
        {
          organizationId: 'org-VICTIM',
          actorUserId: 'user-A',
          actorRole: 'OWNER',
          actionType: 'POLICY_DELETED',
        },
        { required: true },
      ),
    ).rejects.toThrow(/Access denied/i);

    expect(mockInsertOrgAuditLog).not.toHaveBeenCalled();
  });

  it('accepts when caller-session org matches payload.organizationId', async () => {
    mockGetMembership.mockResolvedValue({
      orgId: 'org-A',
      role: 'OWNER' as never,
      userId: 'user-A',
    });

    const result = await logAuditEvent({
      organizationId: 'org-A',
      actorUserId: 'user-A',
      actorRole: 'OWNER',
      actionType: 'POLICY_UPDATED',
    });

    expect(result).toEqual({ success: true });
    expect(mockInsertOrgAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects when caller has no session at all', async () => {
    mockGetMembership.mockRejectedValue(new Error('Unauthorized'));

    const result = await logAuditEvent({
      organizationId: 'org-A',
      actorUserId: 'attacker',
      actorRole: 'OWNER',
      actionType: 'POLICY_DELETED',
    });

    expect(result.success).toBe(false);
    expect(mockInsertOrgAuditLog).not.toHaveBeenCalled();
  });
});

describe('logActivity cross-org guard (audit server-actions-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServerClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-A', email: 'a@example.com' } },
          error: null,
        }),
      },
    });
    mockInsertOrgAuditLog.mockResolvedValue({ data: null, error: null });
  });

  it('skips the insert when caller-session org does NOT match organizationId', async () => {
    mockGetMembership.mockResolvedValue({
      orgId: 'org-A',
      role: 'OWNER' as never,
      userId: 'user-A',
    });

    await logActivity('org-VICTIM', 'UPDATE_POLICY', { resourceName: 'X' });

    expect(mockInsertOrgAuditLog).not.toHaveBeenCalled();
  });

  it('inserts when caller-session org matches organizationId', async () => {
    mockGetMembership.mockResolvedValue({
      orgId: 'org-A',
      role: 'OWNER' as never,
      userId: 'user-A',
    });

    await logActivity('org-A', 'UPDATE_POLICY', { resourceName: 'X' });

    expect(mockInsertOrgAuditLog).toHaveBeenCalledTimes(1);
  });
});
