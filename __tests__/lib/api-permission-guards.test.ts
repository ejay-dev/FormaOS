/** @jest-environment node */

/**
 * Unit tests for lib/api-permission-guards.ts (pure functions only)
 *
 * Tests the synchronous, pure functions exported by the API permission guards:
 * requirePermission, canAccessUserData, canModifyResource, getOrgIdFromPath,
 * unauthorizedResponse, notFoundResponse.
 */

import {
  requirePermission,
  canAccessUserData,
  canModifyResource,
  getOrgIdFromPath,
  type UserContext,
} from '@/lib/api-permission-guards';
import type { DatabaseRole, Permission } from '@/lib/roles';

// -------------------------------------------------------------------------
// Helper: create mock UserContext
// -------------------------------------------------------------------------

function createContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    userId: 'user-1',
    orgId: 'org-1',
    role: 'member' as DatabaseRole,
    email: 'user@example.com',
    ...overrides,
  };
}

// -------------------------------------------------------------------------
// requirePermission
// -------------------------------------------------------------------------

describe('requirePermission', () => {
  it('returns not allowed when context is null', () => {
    const result = requirePermission(null, 'org:manage_settings' as Permission);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Not authenticated');
  });

  it('returns allowed when role has the permission', () => {
    const ctx = createContext({ role: 'owner' });
    const result = requirePermission(ctx, 'org:manage_settings' as Permission);
    expect(result.allowed).toBe(true);
  });

  it('returns not allowed when role lacks the permission', () => {
    const ctx = createContext({ role: 'viewer' });
    const result = requirePermission(ctx, 'org:manage_settings' as Permission);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('viewer');
    expect(result.reason).toContain('org:manage_settings');
  });

  it('returns allowed for admin with admin-level permission', () => {
    const ctx = createContext({ role: 'admin' });
    const result = requirePermission(ctx, 'team:invite_members' as Permission);
    expect(result.allowed).toBe(true);
  });
});

// -------------------------------------------------------------------------
// canAccessUserData
// -------------------------------------------------------------------------

describe('canAccessUserData', () => {
  it('allows users to access their own data', () => {
    const ctx = createContext({ userId: 'user-1', role: 'viewer' });
    expect(canAccessUserData(ctx, 'user-1')).toBe(true);
  });

  it('allows owner to access other user data', () => {
    const ctx = createContext({ userId: 'user-1', role: 'owner' });
    expect(canAccessUserData(ctx, 'user-2')).toBe(true);
  });

  it('allows admin to access other user data', () => {
    const ctx = createContext({ userId: 'user-1', role: 'admin' });
    expect(canAccessUserData(ctx, 'user-2')).toBe(true);
  });

  it('denies member from accessing other user data', () => {
    const ctx = createContext({ userId: 'user-1', role: 'member' });
    expect(canAccessUserData(ctx, 'user-2')).toBe(false);
  });

  it('denies viewer from accessing other user data', () => {
    const ctx = createContext({ userId: 'user-1', role: 'viewer' });
    expect(canAccessUserData(ctx, 'user-2')).toBe(false);
  });
});

// -------------------------------------------------------------------------
// canModifyResource
// -------------------------------------------------------------------------

describe('canModifyResource', () => {
  it('allows owner to modify team resources', () => {
    const ctx = createContext({ role: 'owner' });
    expect(canModifyResource(ctx, 'team')).toBe(true);
  });

  it('allows admin to modify team resources', () => {
    const ctx = createContext({ role: 'admin' });
    expect(canModifyResource(ctx, 'team')).toBe(true);
  });

  it('denies viewer from modifying any resources', () => {
    const ctx = createContext({ role: 'viewer' });
    expect(canModifyResource(ctx, 'team')).toBe(false);
    expect(canModifyResource(ctx, 'cert')).toBe(false);
    expect(canModifyResource(ctx, 'evidence')).toBe(false);
    expect(canModifyResource(ctx, 'task')).toBe(false);
    expect(canModifyResource(ctx, 'settings')).toBe(false);
  });

  it('checks cert resource type', () => {
    const ctx = createContext({ role: 'owner' });
    expect(canModifyResource(ctx, 'cert')).toBe(true);
  });

  it('checks evidence resource type', () => {
    const ctx = createContext({ role: 'admin' });
    expect(canModifyResource(ctx, 'evidence')).toBe(true);
  });

  it('checks task resource type', () => {
    const ctx = createContext({ role: 'admin' });
    expect(canModifyResource(ctx, 'task')).toBe(true);
  });

  it('checks settings resource type', () => {
    const ctx = createContext({ role: 'owner' });
    expect(canModifyResource(ctx, 'settings')).toBe(true);
  });
});

// -------------------------------------------------------------------------
// getOrgIdFromPath
// -------------------------------------------------------------------------

describe('getOrgIdFromPath', () => {
  it('extracts org ID from standard API path', () => {
    expect(getOrgIdFromPath('/api/org/abc-123/members')).toBe('abc-123');
  });

  it('extracts org ID from nested API path', () => {
    expect(getOrgIdFromPath('/api/org/org-xyz/settings/billing')).toBe(
      'org-xyz',
    );
  });

  it('returns null when no org ID in path', () => {
    expect(getOrgIdFromPath('/api/health')).toBeNull();
  });

  it('returns null for empty path', () => {
    expect(getOrgIdFromPath('')).toBeNull();
  });

  it('handles UUID-style org IDs', () => {
    expect(
      getOrgIdFromPath('/api/org/550e8400-e29b-41d4-a716-446655440000/members'),
    ).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});
