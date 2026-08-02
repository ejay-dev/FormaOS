/**
 * Tests for lib/authz/ability.ts
 * Covers: getAbilityForRole, abilityCanPermission, CASL rules
 *
 * Deliberately unmocked: both @casl/ability and ROLE_CAPABILITIES are the
 * real implementations. The previous version stubbed CASL with a single
 * module-level permission array shared by every builder, so once the owner
 * test pushed 'manage' every role could do everything and no
 * role-escalation regression could ever fail this suite.
 */

import { abilityCanPermission, getAbilityForRole } from '@/lib/authz/ability';

describe('abilityCanPermission', () => {
  it('owner can manage all permissions', () => {
    expect(abilityCanPermission('owner', 'org:view_overview')).toBe(true);
    expect(abilityCanPermission('owner', 'billing:manage')).toBe(true);
    expect(abilityCanPermission('owner', 'cert:delete')).toBe(true);
    expect(abilityCanPermission('owner', 'team:change_roles')).toBe(true);
  });

  it('admin has team and task permissions but never billing', () => {
    expect(abilityCanPermission('admin', 'team:invite_members')).toBe(true);
    expect(abilityCanPermission('admin', 'task:view_all')).toBe(true);
    // Billing is owner-only by design (BILLING_ROLES in lib/roles.ts).
    // If createAbilityForRole ever granted admin the owner 'manage' rule,
    // these two assertions are what catches it.
    expect(abilityCanPermission('admin', 'billing:manage')).toBe(false);
    expect(abilityCanPermission('admin', 'billing:view')).toBe(false);
  });

  it('member has limited task permissions and no org administration', () => {
    expect(abilityCanPermission('member', 'task:view_own')).toBe(true);
    expect(abilityCanPermission('member', 'task:create_own')).toBe(true);
    expect(abilityCanPermission('member', 'task:view_all')).toBe(false);
    expect(abilityCanPermission('member', 'task:create_for_others')).toBe(
      false,
    );
    expect(abilityCanPermission('member', 'org:manage_settings')).toBe(false);
    expect(abilityCanPermission('member', 'team:invite_members')).toBe(false);
  });

  it('viewer has read-only permissions', () => {
    expect(abilityCanPermission('viewer', 'org:view_overview')).toBe(true);
    expect(abilityCanPermission('viewer', 'task:view_own')).toBe(true);
    expect(abilityCanPermission('viewer', 'evidence:view_own')).toBe(true);
    // A viewer that can write is the escalation this guards against.
    expect(abilityCanPermission('viewer', 'task:create_own')).toBe(false);
    expect(abilityCanPermission('viewer', 'evidence:upload')).toBe(false);
    expect(abilityCanPermission('viewer', 'cert:edit')).toBe(false);
    expect(abilityCanPermission('viewer', 'billing:manage')).toBe(false);
  });
});

describe('getAbilityForRole', () => {
  it('caches one ability instance per role', () => {
    expect(getAbilityForRole('admin')).toBe(getAbilityForRole('admin'));
    expect(getAbilityForRole('admin')).not.toBe(getAbilityForRole('member'));
  });

  it('scopes permissions to their mapped subject as well as "all"', () => {
    const admin = getAbilityForRole('admin');
    expect(admin.can('team:invite_members', 'team')).toBe(true);
    expect(admin.can('billing:manage', 'billing')).toBe(false);
  });
});
