/** @jest-environment node */

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logActivity: jest.fn(),
}));

jest.mock('@/lib/activity/feed', () => ({
  logActivity: jest.fn(),
}));

jest.mock('@/app/app/actions/rbac', () => ({
  getUserOrgMembership: jest.fn(),
}));

jest.mock('@/app/app/actions/audit-events', () => ({
  logAuditEvent: jest.fn(),
}));

jest.mock('@/lib/actions/safe', () => ({
  actionError: jest.fn((error: unknown) => ({
    error: error instanceof Error ? error.message : 'unknown',
  })),
  isNextInternalError: jest.fn(() => false),
}));

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/logger';
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { getUserOrgMembership } from '@/app/app/actions/rbac';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { updateOrganization } from '@/app/app/actions/org';

describe('updateOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows compliance officers to update workspace identity details', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ update }));

    (getUserOrgMembership as jest.Mock).mockResolvedValue({
      orgId: 'org-1',
      role: 'COMPLIANCE_OFFICER',
      userId: 'user-1',
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue({ from });

    const result = await updateOrganization({
      name: 'Acme Health',
      industry: 'healthcare',
      teamSize: '11-50',
    });

    expect(result).toEqual({ success: true });
    expect(from).toHaveBeenCalledWith('organizations');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme Health',
        industry: 'healthcare',
        team_size: '11-50',
      }),
    );
    expect(eq).toHaveBeenCalledWith('id', 'org-1');
    expect(logActivity).toHaveBeenCalledWith(
      'org-1',
      'updated_policy',
      'Admin updated organization profile settings.',
    );
    expect(logProductActivity).toHaveBeenCalled();
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        actorUserId: 'user-1',
        actorRole: 'COMPLIANCE_OFFICER',
        actionType: 'ORG_UPDATED',
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith('/app/settings');
    expect(revalidatePath).toHaveBeenCalledWith('/app/settings/organization');
    expect(revalidatePath).toHaveBeenCalledWith('/app');
  });

  it('rejects non-admin roles', async () => {
    (getUserOrgMembership as jest.Mock).mockResolvedValue({
      orgId: 'org-1',
      role: 'VIEWER',
      userId: 'user-1',
    });

    const result = await updateOrganization({
      name: 'Nope Corp',
    });

    expect(result).toEqual({
      error:
        'Security Violation: Only owners and admins can modify organization settings.',
    });
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
