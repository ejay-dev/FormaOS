/** @jest-environment node */

/**
 * Unit tests for lib/permissions.ts (DEPRECATED module)
 *
 * Tests the legacy permission system and its backward compatibility.
 * This module maps old roles (admin/manager/staff) to new DatabaseRole.
 */

import { PERMISSIONS, hasPermission } from '@/lib/permissions';

// -------------------------------------------------------------------------
// PERMISSIONS structure
// -------------------------------------------------------------------------

describe('PERMISSIONS (legacy)', () => {
  it('defines permissions for all three legacy roles', () => {
    expect(PERMISSIONS.admin).toBeDefined();
    expect(PERMISSIONS.manager).toBeDefined();
    expect(PERMISSIONS.staff).toBeDefined();
  });

  it('admin has the most permissions', () => {
    expect(PERMISSIONS.admin.length).toBeGreaterThanOrEqual(
      PERMISSIONS.manager.length,
    );
  });

  it('admin can manage_users', () => {
    expect(PERMISSIONS.admin).toContain('manage_users');
  });

  it('admin can manage_billing', () => {
    expect(PERMISSIONS.admin).toContain('manage_billing');
  });

  it('manager can view_audit', () => {
    expect(PERMISSIONS.manager).toContain('view_audit');
  });

  it('manager can assign_tasks', () => {
    expect(PERMISSIONS.manager).toContain('assign_tasks');
  });

  it('staff can view_tasks', () => {
    expect(PERMISSIONS.staff).toContain('view_tasks');
  });

  it('staff can upload_evidence', () => {
    expect(PERMISSIONS.staff).toContain('upload_evidence');
  });

  it('staff cannot manage_users', () => {
    expect(PERMISSIONS.staff).not.toContain('manage_users');
  });
});

// -------------------------------------------------------------------------
// hasPermission (legacy)
// -------------------------------------------------------------------------

describe('hasPermission (legacy)', () => {
  it('returns true for admin with manage_users', () => {
    expect(hasPermission('admin', 'manage_users')).toBe(true);
  });

  it('returns true for admin with edit_policies', () => {
    expect(hasPermission('admin', 'edit_policies')).toBe(true);
  });

  it('returns false for staff with manage_billing', () => {
    expect(hasPermission('staff', 'manage_billing')).toBe(false);
  });

  it('returns true for manager with assign_tasks', () => {
    expect(hasPermission('manager', 'assign_tasks')).toBe(true);
  });

  it('returns false for manager with manage_users', () => {
    expect(hasPermission('manager', 'manage_users')).toBe(false);
  });

  it('returns false for any role with nonexistent action', () => {
    expect(hasPermission('admin', 'fly_to_moon')).toBe(false);
    expect(hasPermission('manager', 'fly_to_moon')).toBe(false);
    expect(hasPermission('staff', 'fly_to_moon')).toBe(false);
  });

  it('returns true for staff with view_policies', () => {
    expect(hasPermission('staff', 'view_policies')).toBe(true);
  });
});
