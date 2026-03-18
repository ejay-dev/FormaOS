import {
  getProvisioningFrameworkSlugs,
  isFrameworkProvisionable,
} from '@/lib/onboarding/framework-selection';

describe('framework selection', () => {
  it('filters provisioning frameworks', () => {
    const slugs = getProvisioningFrameworkSlugs([
      'ISO27001',
      'gdpr',
      'custom',
      'SOC2',
      'foo',
    ]);

    expect(slugs).toEqual(expect.arrayContaining(['iso27001', 'gdpr', 'soc2']));
    expect(slugs).not.toContain('custom');
    expect(slugs).not.toContain('foo');
  });

  it('detects provisionable slugs', () => {
    expect(isFrameworkProvisionable('iso27001')).toBe(true);
    expect(isFrameworkProvisionable('pci-dss')).toBe(true);
    expect(isFrameworkProvisionable('custom')).toBe(false);
  });
});
