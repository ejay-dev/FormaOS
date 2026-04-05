/**
 * Tests for lib/navigation/industry-sidebar.ts — nav config + helper functions
 * This file is 1457 LOC; testing it provides significant coverage gain.
 */

import {
  NDIS_NAV,
  HEALTHCARE_NAV,
  AGED_CARE_NAV,
  CHILDCARE_NAV,
  COMMUNITY_SERVICES_NAV,
  FINANCIAL_SERVICES_NAV,
  SAAS_TECHNOLOGY_NAV,
  ENTERPRISE_NAV,
  DEFAULT_ADMIN_NAV,
  STAFF_NAV,
  getIndustryNavigation,
  isCareIndustry,
  getIndustryLabel,
  type NavItem,
} from '@/lib/navigation/industry-sidebar';

const ALL_NAV_CONFIGS: [string, NavItem[]][] = [
  ['ndis', NDIS_NAV],
  ['healthcare', HEALTHCARE_NAV],
  ['aged_care', AGED_CARE_NAV],
  ['childcare', CHILDCARE_NAV],
  ['community_services', COMMUNITY_SERVICES_NAV],
  ['financial_services', FINANCIAL_SERVICES_NAV],
  ['saas_technology', SAAS_TECHNOLOGY_NAV],
  ['enterprise', ENTERPRISE_NAV],
  ['default', DEFAULT_ADMIN_NAV],
  ['staff', STAFF_NAV],
];

describe('navigation config arrays', () => {
  it.each(ALL_NAV_CONFIGS)('%s nav is non-empty', (_name, nav) => {
    expect(nav.length).toBeGreaterThan(0);
  });

  it.each(ALL_NAV_CONFIGS)(
    '%s nav items have required fields',
    (_name, nav) => {
      for (const item of nav) {
        expect(item.name).toBeTruthy();
        expect(item.href).toBeTruthy();
        expect(item.icon).toBeDefined();
        expect(item.category).toBeTruthy();
      }
    },
  );

  it.each(ALL_NAV_CONFIGS)(
    '%s nav items have unique hrefs within category',
    (_name, nav) => {
      const hrefs = nav.map((item: NavItem) => item.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    },
  );

  it('all admin nav configs include dashboard', () => {
    const adminNavs = [
      NDIS_NAV,
      HEALTHCARE_NAV,
      AGED_CARE_NAV,
      DEFAULT_ADMIN_NAV,
      ENTERPRISE_NAV,
    ];
    for (const nav of adminNavs) {
      const names = nav.map((item: NavItem) => item.name.toLowerCase());
      expect(names.some((n: string) => n.includes('dashboard'))).toBe(true);
    }
  });
});

describe('getIndustryNavigation', () => {
  it('returns NDIS nav for ndis industry', () => {
    const result = getIndustryNavigation('ndis', 'owner');
    expect(result.navigation).toBe(NDIS_NAV);
    expect(result.categories.length).toBeGreaterThan(0);
  });

  it('returns healthcare nav', () => {
    const result = getIndustryNavigation('healthcare', 'admin');
    expect(result.navigation).toBe(HEALTHCARE_NAV);
  });

  it('returns aged_care nav', () => {
    const result = getIndustryNavigation('aged_care', 'owner');
    expect(result.navigation).toBe(AGED_CARE_NAV);
  });

  it('returns childcare nav', () => {
    const result = getIndustryNavigation('childcare', 'owner');
    expect(result.navigation).toBe(CHILDCARE_NAV);
  });

  it('returns community_services nav', () => {
    const result = getIndustryNavigation('community_services', 'owner');
    expect(result.navigation).toBe(COMMUNITY_SERVICES_NAV);
  });

  it('returns financial_services nav', () => {
    const result = getIndustryNavigation('financial_services', 'owner');
    expect(result.navigation).toBe(FINANCIAL_SERVICES_NAV);
  });

  it('returns saas_technology nav', () => {
    const result = getIndustryNavigation('saas_technology', 'owner');
    expect(result.navigation).toBe(SAAS_TECHNOLOGY_NAV);
  });

  it('returns enterprise nav', () => {
    const result = getIndustryNavigation('enterprise', 'owner');
    expect(result.navigation).toBe(ENTERPRISE_NAV);
  });

  it('returns default nav for unknown industry', () => {
    const result = getIndustryNavigation('unknown', 'owner');
    expect(result.navigation).toBe(DEFAULT_ADMIN_NAV);
  });

  it('returns default nav for null industry', () => {
    const result = getIndustryNavigation(null, 'owner');
    expect(result.navigation).toBe(DEFAULT_ADMIN_NAV);
  });

  it('returns default nav for undefined industry', () => {
    const result = getIndustryNavigation(undefined, 'owner');
    expect(result.navigation).toBe(DEFAULT_ADMIN_NAV);
  });

  it('returns staff nav for member role', () => {
    const result = getIndustryNavigation('ndis', 'member');
    expect(result.navigation).toBe(STAFF_NAV);
  });

  it('returns staff nav for viewer role', () => {
    const result = getIndustryNavigation('healthcare', 'viewer');
    expect(result.navigation).toBe(STAFF_NAV);
  });

  it('returns staff nav for staff role', () => {
    const result = getIndustryNavigation('enterprise', 'staff');
    expect(result.navigation).toBe(STAFF_NAV);
  });

  it('categories are unique', () => {
    const result = getIndustryNavigation('ndis', 'owner');
    expect(new Set(result.categories).size).toBe(result.categories.length);
  });
});

describe('isCareIndustry', () => {
  it('returns true for ndis', () => expect(isCareIndustry('ndis')).toBe(true));
  it('returns true for healthcare', () =>
    expect(isCareIndustry('healthcare')).toBe(true));
  it('returns true for aged_care', () =>
    expect(isCareIndustry('aged_care')).toBe(true));
  it('returns true for childcare', () =>
    expect(isCareIndustry('childcare')).toBe(true));
  it('returns true for community_services', () =>
    expect(isCareIndustry('community_services')).toBe(true));
  it('returns false for financial_services', () =>
    expect(isCareIndustry('financial_services')).toBe(false));
  it('returns false for saas_technology', () =>
    expect(isCareIndustry('saas_technology')).toBe(false));
  it('returns false for enterprise', () =>
    expect(isCareIndustry('enterprise')).toBe(false));
  it('returns false for null', () => expect(isCareIndustry(null)).toBe(false));
  it('returns false for undefined', () =>
    expect(isCareIndustry(undefined)).toBe(false));
});

describe('getIndustryLabel', () => {
  it('returns NDIS Provider for ndis', () =>
    expect(getIndustryLabel('ndis')).toBe('NDIS Provider'));
  it('returns Healthcare for healthcare', () =>
    expect(getIndustryLabel('healthcare')).toBe('Healthcare'));
  it('returns Aged Care for aged_care', () =>
    expect(getIndustryLabel('aged_care')).toBe('Aged Care'));
  it('returns Childcare for childcare', () =>
    expect(getIndustryLabel('childcare')).toBe('Childcare'));
  it('returns Community Services', () =>
    expect(getIndustryLabel('community_services')).toBe('Community Services'));
  it('returns Financial Services', () =>
    expect(getIndustryLabel('financial_services')).toBe('Financial Services'));
  it('returns SaaS / Technology', () =>
    expect(getIndustryLabel('saas_technology')).toBe('SaaS / Technology'));
  it('returns Enterprise', () =>
    expect(getIndustryLabel('enterprise')).toBe('Enterprise'));
  it('returns General Compliance for other', () =>
    expect(getIndustryLabel('other')).toBe('General Compliance'));
  it('returns Organization for null', () =>
    expect(getIndustryLabel(null)).toBe('Organization'));
  it('returns Organization for undefined', () =>
    expect(getIndustryLabel(undefined)).toBe('Organization'));
  it('returns Organization for unknown value', () =>
    expect(getIndustryLabel('xyz')).toBe('Organization'));
});
