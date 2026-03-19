/** @jest-environment node */

/**
 * Unit tests for lib/security/mfa-enforcement.ts
 * — MFA requirement logic for privileged roles
 */

import { mockSupabase } from '@/tests/helpers/mock-supabase';

// ---------------------------------------------------------------------------
// Mock Supabase server client
// ---------------------------------------------------------------------------

const supabaseMock = mockSupabase();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => supabaseMock.client),
}));

import {
  roleRequiresMFA,
  checkMFAStatus,
  enforceMFAForPrivilegedActions,
} from '@/lib/security/mfa-enforcement';

// ---------------------------------------------------------------------------
// roleRequiresMFA (pure function)
// ---------------------------------------------------------------------------

describe('roleRequiresMFA', () => {
  it('returns true for "owner" role', () => {
    expect(roleRequiresMFA('owner')).toBe(true);
  });

  it('returns true for "admin" role', () => {
    expect(roleRequiresMFA('admin')).toBe(true);
  });

  it('returns true for "OWNER" (uppercase variant)', () => {
    expect(roleRequiresMFA('OWNER')).toBe(true);
  });

  it('returns true for "COMPLIANCE_OFFICER" role', () => {
    expect(roleRequiresMFA('COMPLIANCE_OFFICER')).toBe(true);
  });

  it('returns true for "MANAGER" role', () => {
    expect(roleRequiresMFA('MANAGER')).toBe(true);
  });

  it('returns false for "member" role', () => {
    expect(roleRequiresMFA('member')).toBe(false);
  });

  it('returns false for "viewer" role', () => {
    expect(roleRequiresMFA('viewer')).toBe(false);
  });

  it('returns false for null role', () => {
    expect(roleRequiresMFA(null)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(roleRequiresMFA('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkMFAStatus
// ---------------------------------------------------------------------------

describe('checkMFAStatus', () => {
  beforeEach(() => {
    supabaseMock.reset();
  });

  it('returns required=true and enabled=false for an admin without MFA', async () => {
    // First query: org_members
    supabaseMock.queueResponse({
      match: { table: 'org_members' },
      response: {
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      },
    });
    // Second query: user_security
    supabaseMock.queueResponse({
      match: { table: 'user_security' },
      response: {
        data: { two_factor_enabled: false, two_factor_enabled_at: null },
        error: null,
      },
    });

    const status = await checkMFAStatus('user-123');
    expect(status.required).toBe(true);
    expect(status.enabled).toBe(false);
    expect(status.reason).toContain('admin');
    expect(status.reason).toContain('requires MFA');
  });

  it('returns required=true and enabled=true for an admin with MFA enabled', async () => {
    supabaseMock.queueResponse({
      match: { table: 'org_members' },
      response: {
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      },
    });
    supabaseMock.queueResponse({
      match: { table: 'user_security' },
      response: {
        data: {
          two_factor_enabled: true,
          two_factor_enabled_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      },
    });

    const status = await checkMFAStatus('user-123');
    expect(status.required).toBe(true);
    expect(status.enabled).toBe(true);
    expect(status.reason).toBeUndefined();
  });

  it('returns required=false for a non-privileged member', async () => {
    supabaseMock.queueResponse({
      match: { table: 'org_members' },
      response: {
        data: { role: 'member', organization_id: 'org-1' },
        error: null,
      },
    });
    supabaseMock.queueResponse({
      match: { table: 'user_security' },
      response: {
        data: { two_factor_enabled: false, two_factor_enabled_at: null },
        error: null,
      },
    });

    const status = await checkMFAStatus('user-456');
    expect(status.required).toBe(false);
    expect(status.enabled).toBe(false);
    expect(status.reason).toBeUndefined();
  });

  it('returns required=false when no membership record exists', async () => {
    supabaseMock.queueResponse({
      match: { table: 'org_members' },
      response: { data: null, error: null },
    });
    supabaseMock.queueResponse({
      match: { table: 'user_security' },
      response: { data: null, error: null },
    });

    const status = await checkMFAStatus('user-789');
    expect(status.required).toBe(false);
    expect(status.enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// enforceMFAForPrivilegedActions
// ---------------------------------------------------------------------------

describe('enforceMFAForPrivilegedActions', () => {
  beforeEach(() => {
    supabaseMock.reset();
  });

  it('blocks a privileged user without MFA from performing a sensitive action', async () => {
    supabaseMock.queueResponse({
      match: { table: 'org_members' },
      response: {
        data: { role: 'owner', organization_id: 'org-1' },
        error: null,
      },
    });
    supabaseMock.queueResponse({
      match: { table: 'user_security' },
      response: {
        data: { two_factor_enabled: false, two_factor_enabled_at: null },
        error: null,
      },
    });

    const result = await enforceMFAForPrivilegedActions(
      'user-123',
      'delete_organization',
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('MFA enrollment required');
    expect(result.reason).toContain('delete_organization');
  });

  it('allows a privileged user with MFA enabled', async () => {
    supabaseMock.queueResponse({
      match: { table: 'org_members' },
      response: {
        data: { role: 'owner', organization_id: 'org-1' },
        error: null,
      },
    });
    supabaseMock.queueResponse({
      match: { table: 'user_security' },
      response: {
        data: {
          two_factor_enabled: true,
          two_factor_enabled_at: '2025-06-01T00:00:00Z',
        },
        error: null,
      },
    });

    const result = await enforceMFAForPrivilegedActions(
      'user-123',
      'delete_organization',
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('allows a non-privileged user even without MFA', async () => {
    supabaseMock.queueResponse({
      match: { table: 'org_members' },
      response: {
        data: { role: 'member', organization_id: 'org-1' },
        error: null,
      },
    });
    supabaseMock.queueResponse({
      match: { table: 'user_security' },
      response: {
        data: { two_factor_enabled: false, two_factor_enabled_at: null },
        error: null,
      },
    });

    const result = await enforceMFAForPrivilegedActions(
      'user-456',
      'update_settings',
    );
    expect(result.allowed).toBe(true);
  });
});
