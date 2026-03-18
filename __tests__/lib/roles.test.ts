/** @jest-environment node */

/**
 * Unit tests for lib/roles.ts
 *
 * Tests the core RBAC system: DatabaseRole, Permission, ROLE_CAPABILITIES,
 * hasPermission(), getRoleGroup(), isEmployerRole(), isEmployeeRole(),
 * MODULE_ACCESS, canAccessModule(), getModuleState().
 */

import {
  type DatabaseRole,
  type Permission,
  type ModuleId,
  type NodeState,
  ROLE_CAPABILITIES,
  hasPermission,
  getRoleGroup,
  isEmployerRole,
  isEmployeeRole,
  MODULE_ACCESS,
  canAccessModule,
  getModuleState,
} from '@/lib/roles';

const ALL_ROLES: DatabaseRole[] = ['owner', 'admin', 'member', 'viewer'];

// -------------------------------------------------------------------------
// ROLE_CAPABILITIES structure
// -------------------------------------------------------------------------

describe('ROLE_CAPABILITIES', () => {
  const allRoles: DatabaseRole[] = ['owner', 'admin', 'member', 'viewer'];

  it('defines capabilities for all four roles', () => {
    for (const role of allRoles) {
      expect(ROLE_CAPABILITIES[role]).toBeDefined();
      expect(Array.isArray(ROLE_CAPABILITIES[role])).toBe(true);
    }
  });

  it('gives owner the most permissions', () => {
    const ownerCount = ROLE_CAPABILITIES.owner.length;
    const adminCount = ROLE_CAPABILITIES.admin.length;
    const memberCount = ROLE_CAPABILITIES.member.length;
    const viewerCount = ROLE_CAPABILITIES.viewer.length;

    expect(ownerCount).toBeGreaterThanOrEqual(adminCount);
    expect(adminCount).toBeGreaterThanOrEqual(memberCount);
    expect(memberCount).toBeGreaterThanOrEqual(viewerCount);
  });

  it('owner has all admin permissions', () => {
    for (const perm of ROLE_CAPABILITIES.admin) {
      expect(ROLE_CAPABILITIES.owner).toContain(perm);
    }
  });

  it('admin has all member permissions', () => {
    for (const perm of ROLE_CAPABILITIES.member) {
      expect(ROLE_CAPABILITIES.admin).toContain(perm);
    }
  });

  it('viewer has org:view_overview but member does not (by design)', () => {
    // Viewers get a read-only org overview; members focus on personal modules
    expect(ROLE_CAPABILITIES.viewer).toContain('org:view_overview');
    expect(ROLE_CAPABILITIES.member).not.toContain('org:view_overview');
  });

  it('viewer has read-only permissions', () => {
    for (const perm of ROLE_CAPABILITIES.viewer) {
      // Viewer permissions should be view/read type
      expect(perm).toMatch(/view|read|dashboard/i);
    }
  });
});

// -------------------------------------------------------------------------
// hasPermission
// -------------------------------------------------------------------------

describe('hasPermission', () => {
  it('returns true for owner with any permission', () => {
    for (const perm of ROLE_CAPABILITIES.owner) {
      expect(hasPermission('owner', perm)).toBe(true);
    }
  });

  it('returns false for viewer with admin-only permissions', () => {
    // Find permissions owner has but viewer doesn't
    const adminOnlyPerms = ROLE_CAPABILITIES.owner.filter(
      (p: Permission) => !ROLE_CAPABILITIES.viewer.includes(p),
    );

    for (const perm of adminOnlyPerms) {
      expect(hasPermission('viewer', perm)).toBe(false);
    }
  });

  it('returns false for invalid permission string', () => {
    expect(hasPermission('owner', 'nonexistent:permission' as Permission)).toBe(
      false,
    );
  });

  it('returns true for member with member-level permissions', () => {
    for (const perm of ROLE_CAPABILITIES.member) {
      expect(hasPermission('member', perm)).toBe(true);
    }
  });

  it('returns false for member with owner-only permissions', () => {
    const ownerOnlyPerms = ROLE_CAPABILITIES.owner.filter(
      (p: Permission) => !ROLE_CAPABILITIES.member.includes(p),
    );

    for (const perm of ownerOnlyPerms) {
      expect(hasPermission('member', perm)).toBe(false);
    }
  });
});

// -------------------------------------------------------------------------
// getRoleGroup
// -------------------------------------------------------------------------

describe('getRoleGroup', () => {
  it('classifies owner as employer', () => {
    expect(getRoleGroup('owner')).toBe('employer');
  });

  it('classifies admin as employer', () => {
    expect(getRoleGroup('admin')).toBe('employer');
  });

  it('classifies member as employee', () => {
    expect(getRoleGroup('member')).toBe('employee');
  });

  it('classifies viewer as employee', () => {
    expect(getRoleGroup('viewer')).toBe('employee');
  });
});

// -------------------------------------------------------------------------
// isEmployerRole / isEmployeeRole
// -------------------------------------------------------------------------

describe('isEmployerRole', () => {
  it('returns true for owner', () => {
    expect(isEmployerRole('owner')).toBe(true);
  });

  it('returns true for admin', () => {
    expect(isEmployerRole('admin')).toBe(true);
  });

  it('returns false for member', () => {
    expect(isEmployerRole('member')).toBe(false);
  });

  it('returns false for viewer', () => {
    expect(isEmployerRole('viewer')).toBe(false);
  });
});

describe('isEmployeeRole', () => {
  it('returns false for owner', () => {
    expect(isEmployeeRole('owner')).toBe(false);
  });

  it('returns false for admin', () => {
    expect(isEmployeeRole('admin')).toBe(false);
  });

  it('returns true for member', () => {
    expect(isEmployeeRole('member')).toBe(true);
  });

  it('returns true for viewer', () => {
    expect(isEmployeeRole('viewer')).toBe(true);
  });
});

// -------------------------------------------------------------------------
// MODULE_ACCESS
// -------------------------------------------------------------------------

describe('MODULE_ACCESS', () => {
  const allModules: ModuleId[] = [
    'org_overview',
    'team_management',
    'certificates',
    'evidence',
    'tasks',
    'audit_logs',
    'billing',
    'admin_settings',
    'my_compliance',
    'my_certificates',
    'my_evidence',
    'my_tasks',
    'training',
  ];

  it('is defined and has entries for all roles', () => {
    expect(MODULE_ACCESS).toBeDefined();
    for (const role of ALL_ROLES) {
      expect(MODULE_ACCESS[role]).toBeDefined();
    }
  });

  it('each role defines state for all modules', () => {
    const validStates: NodeState[] = [
      'locked',
      'active',
      'restricted',
      'loading',
    ];

    for (const role of ALL_ROLES) {
      for (const mod of allModules) {
        const state = MODULE_ACCESS[role][mod];
        expect(state).toBeDefined();
        expect(validStates).toContain(state);
      }
    }
  });

  it('owner has active state for admin modules', () => {
    expect(MODULE_ACCESS.owner.org_overview).toBe('active');
    expect(MODULE_ACCESS.owner.team_management).toBe('active');
    expect(MODULE_ACCESS.owner.billing).toBe('active');
    expect(MODULE_ACCESS.owner.admin_settings).toBe('active');
  });

  it('viewer has locked state for admin modules', () => {
    expect(MODULE_ACCESS.viewer.org_overview).toBe('locked');
    expect(MODULE_ACCESS.viewer.team_management).toBe('locked');
    expect(MODULE_ACCESS.viewer.billing).toBe('locked');
    expect(MODULE_ACCESS.viewer.admin_settings).toBe('locked');
  });

  it('member has active state for personal modules', () => {
    expect(MODULE_ACCESS.member.my_compliance).toBe('active');
    expect(MODULE_ACCESS.member.my_certificates).toBe('active');
    expect(MODULE_ACCESS.member.my_evidence).toBe('active');
    expect(MODULE_ACCESS.member.my_tasks).toBe('active');
  });
});

// -------------------------------------------------------------------------
// canAccessModule
// -------------------------------------------------------------------------

describe('canAccessModule', () => {
  it('returns true for owner on active modules', () => {
    expect(canAccessModule('owner', 'org_overview')).toBe(true);
    expect(canAccessModule('owner', 'billing')).toBe(true);
    expect(canAccessModule('owner', 'admin_settings')).toBe(true);
  });

  it('returns true for restricted modules (has access but limited)', () => {
    expect(canAccessModule('owner', 'my_compliance')).toBe(true);
    expect(canAccessModule('viewer', 'my_compliance')).toBe(true);
  });

  it('returns false for locked modules', () => {
    expect(canAccessModule('viewer', 'org_overview')).toBe(false);
    expect(canAccessModule('viewer', 'billing')).toBe(false);
    expect(canAccessModule('member', 'admin_settings')).toBe(false);
  });

  it('training is accessible to all roles', () => {
    for (const role of ALL_ROLES) {
      expect(canAccessModule(role, 'training')).toBe(true);
    }
  });
});

// -------------------------------------------------------------------------
// getModuleState
// -------------------------------------------------------------------------

describe('getModuleState', () => {
  it('returns correct state for owner', () => {
    expect(getModuleState('owner', 'org_overview')).toBe('active');
    expect(getModuleState('owner', 'my_compliance')).toBe('restricted');
  });

  it('returns correct state for viewer', () => {
    expect(getModuleState('viewer', 'org_overview')).toBe('locked');
    expect(getModuleState('viewer', 'training')).toBe('active');
    expect(getModuleState('viewer', 'my_certificates')).toBe('restricted');
  });

  it('returns correct state for member', () => {
    expect(getModuleState('member', 'my_tasks')).toBe('active');
    expect(getModuleState('member', 'billing')).toBe('locked');
  });

  it('returns undefined for unknown module', () => {
    expect(
      getModuleState('viewer', 'nonexistent_module' as ModuleId),
    ).toBeUndefined();
  });
});
