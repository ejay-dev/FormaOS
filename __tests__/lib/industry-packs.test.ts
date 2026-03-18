/** @jest-environment node */

import {
  applyIndustryPackCustomization,
  getIndustryPack,
  INDUSTRY_PACKS,
  INDUSTRY_PACK_VERSION,
  listIndustryPacks,
  mapIndustryPackToFrameworks,
} from '@/lib/industry-packs';

describe('industry-packs', () => {
  it('exposes a stable set of pack ids with populated content', () => {
    const packs = listIndustryPacks();

    expect(packs.length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(INDUSTRY_PACKS)).toEqual(
      expect.arrayContaining([
        'ndis',
        'healthcare',
        'financial_services',
        'saas_technology',
      ]),
    );

    packs.forEach((pack) => {
      expect(pack.id).toBeTruthy();
      expect(pack.policies.length).toBeGreaterThan(0);
      expect(pack.tasks.length).toBeGreaterThan(0);
      expect(pack.assets.length).toBeGreaterThan(0);
    });
  });

  it('loads a pack by id and preserves pack identity', () => {
    expect(getIndustryPack('healthcare')).toEqual(
      expect.objectContaining({
        id: 'healthcare',
        name: 'GP / Medical Practice',
      }),
    );
    expect(getIndustryPack('missing-pack')).toBeNull();
  });

  it('applies pack customizations without mutating the source pack', () => {
    const original = getIndustryPack('saas_technology');
    const customized = applyIndustryPackCustomization('saas_technology', {
      name: 'SaaS Custom',
      tasks: [{ title: 'Run pentest', description: 'Schedule external test.' }],
    });

    expect(customized).toEqual(
      expect.objectContaining({
        id: 'saas_technology',
        name: 'SaaS Custom',
      }),
    );
    expect(customized?.tasks).toHaveLength(1);
    expect(original?.name).toBe('SaaS / Technology');
    expect(original?.tasks.length).toBeGreaterThan(1);
  });

  it('maps pack inventory counts onto requested frameworks with version metadata', () => {
    expect(
      mapIndustryPackToFrameworks('financial_services', ['soc2', 'iso27001']),
    ).toEqual([
      {
        industryId: 'financial_services',
        framework: 'soc2',
        policyCount: INDUSTRY_PACKS.financial_services.policies.length,
        taskCount: INDUSTRY_PACKS.financial_services.tasks.length,
        assetCount: INDUSTRY_PACKS.financial_services.assets.length,
        version: INDUSTRY_PACK_VERSION,
      },
      {
        industryId: 'financial_services',
        framework: 'iso27001',
        policyCount: INDUSTRY_PACKS.financial_services.policies.length,
        taskCount: INDUSTRY_PACKS.financial_services.tasks.length,
        assetCount: INDUSTRY_PACKS.financial_services.assets.length,
        version: INDUSTRY_PACK_VERSION,
      },
    ]);
  });
});
