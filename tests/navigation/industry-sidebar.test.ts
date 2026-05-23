import {
  DEFAULT_ADMIN_NAV,
  ENTERPRISE_NAV,
  HEALTHCARE_NAV,
  STAFF_NAV,
  getIndustryNavigation,
  type NavItem,
} from '@/lib/navigation/industry-sidebar';

// v4-031: getIndustryNavigation now runs the selected nav through
// withOrphanChildren() which augments parent items with sub-nav
// `children` from the ORPHAN_ROUTE_CHILDREN map. Top-level identity
// is unchanged (same hrefs, same testIds), so structural-by-href is
// the right assertion. Children augmentation has its own test.
function expectSameTopLevelItems(actual: NavItem[], expected: NavItem[]) {
  expect(actual.map((i) => i.href)).toEqual(expected.map((i) => i.href));
  expect(actual.map((i) => i.testId)).toEqual(expected.map((i) => i.testId));
}

describe('getIndustryNavigation', () => {
  it('returns healthcare admin navigation for employer roles', () => {
    const result = getIndustryNavigation('healthcare', 'owner');

    expectSameTopLevelItems(result.navigation, HEALTHCARE_NAV);
    expect(result.categories).toEqual([
      'Overview',
      'Compliance',
      'Clinical',
      'Workforce',
      'Registers',
      'Reports',
      'System',
    ]);
    expect(
      result.navigation.some((item) => item.testId === 'nav-patients'),
    ).toBe(true);
    expect(
      result.navigation.some((item) => item.testId === 'nav-staff-credentials'),
    ).toBe(true);
  });

  it('returns enterprise navigation for admin roles in enterprise workspaces', () => {
    const result = getIndustryNavigation('enterprise', 'admin');

    expectSameTopLevelItems(result.navigation, ENTERPRISE_NAV);
    expect(
      result.navigation.some((item) => item.testId === 'nav-executive'),
    ).toBe(true);
    expect(result.navigation.some((item) => item.testId === 'nav-team')).toBe(
      true,
    );
  });

  it('returns staff navigation for member roles regardless of industry', () => {
    const healthcareMember = getIndustryNavigation('healthcare', 'member');
    const enterpriseViewer = getIndustryNavigation('enterprise', 'viewer');

    // Staff nav is returned by-reference (no orphan augmentation).
    expect(healthcareMember.navigation).toEqual(STAFF_NAV);
    expect(healthcareMember.categories).toEqual(['Overview', 'Operations']);
    expect(
      healthcareMember.navigation.some(
        (item) => item.testId === 'nav-patients',
      ),
    ).toBe(false);

    expect(enterpriseViewer.navigation).toEqual(STAFF_NAV);
    expect(
      enterpriseViewer.navigation.some(
        (item) => item.testId === 'nav-executive',
      ),
    ).toBe(false);
  });

  it('falls back to the default admin navigation for unknown industries', () => {
    const result = getIndustryNavigation('unknown-industry', 'owner');

    expectSameTopLevelItems(result.navigation, DEFAULT_ADMIN_NAV);
    expect(
      result.navigation.some((item) => item.testId === 'nav-policies'),
    ).toBe(true);
    expect(
      result.navigation.some((item) => item.testId === 'nav-ai-assistant'),
    ).toBe(true);
  });
});
