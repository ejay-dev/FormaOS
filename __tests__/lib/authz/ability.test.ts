/**
 * Tests for lib/authz/ability.ts
 * Covers: getAbilityForRole, abilityCanPermission, CASL rules
 */

jest.mock('@casl/ability', () => {
  const perms: string[] = [];
  return {
    AbilityBuilder: jest.fn().mockImplementation(() => ({
      can: (action: string, _subject: string) => {
        perms.push(action);
      },
      build: () => ({
        can: (action: string, _subject: string) =>
          perms.includes(action) || perms.includes('manage'),
      }),
    })),
    createMongoAbility: jest.fn(),
  };
});

jest.mock('@/lib/roles', () => ({
  ROLE_CAPABILITIES: {
    owner: [
      'org:view_overview',
      'org:manage_settings',
      'team:invite_members',
      'billing:manage',
    ],
    admin: [
      'org:view_overview',
      'org:manage_settings',
      'team:invite_members',
      'task:view_all',
      'task:create_for_others',
    ],
    manager: [
      'org:view_overview',
      'team:view_all_members',
      'task:view_all',
      'task:create_own',
    ],
    member: [
      'org:view_overview',
      'task:view_own',
      'task:create_own',
      'task:complete_own',
    ],
    viewer: ['org:view_overview', 'task:view_own'],
  },
}));

import { abilityCanPermission } from '@/lib/authz/ability';

describe('abilityCanPermission', () => {
  it('owner can manage all permissions', () => {
    expect(abilityCanPermission('owner', 'org:view_overview')).toBe(true);
    expect(abilityCanPermission('owner', 'billing:manage')).toBe(true);
  });

  it('admin has team and task permissions', () => {
    expect(abilityCanPermission('admin', 'team:invite_members')).toBe(true);
    expect(abilityCanPermission('admin', 'task:view_all')).toBe(true);
  });

  it('member has limited task permissions', () => {
    expect(abilityCanPermission('member', 'task:view_own')).toBe(true);
    expect(abilityCanPermission('member', 'task:create_own')).toBe(true);
  });

  it('viewer has minimal permissions', () => {
    expect(abilityCanPermission('viewer', 'org:view_overview')).toBe(true);
    expect(abilityCanPermission('viewer', 'task:view_own')).toBe(true);
  });
});
