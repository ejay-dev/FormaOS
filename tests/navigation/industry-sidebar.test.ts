import {
  DEFAULT_ADMIN_NAV,
  ENTERPRISE_NAV,
  HEALTHCARE_NAV,
  STAFF_NAV,
  getIndustryNavigation,
} from '@/lib/navigation/industry-sidebar';

describe('getIndustryNavigation', () => {
  it('returns healthcare admin navigation for employer roles', () => {
    const result = getIndustryNavigation('healthcare', 'owner');

    expect(result.navigation).toEqual(HEALTHCARE_NAV);
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

    expect(result.navigation).toEqual(ENTERPRISE_NAV);
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

    expect(result.navigation).toEqual(DEFAULT_ADMIN_NAV);
    expect(
      result.navigation.some((item) => item.testId === 'nav-policies'),
    ).toBe(true);
    expect(
      result.navigation.some((item) => item.testId === 'nav-ai-assistant'),
    ).toBe(true);
  });
});
