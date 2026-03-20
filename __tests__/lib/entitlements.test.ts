/**
 * @jest-environment node
 */

const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';

const TEST_ORG_ID = 'org_test_abc123';

beforeEach(() => {
  mockFrom.mockClear();
  mockUpsert.mockClear();
});

describe('syncEntitlementsForPlan', () => {
  it('upserts correct records for the basic plan', async () => {
    await syncEntitlementsForPlan(TEST_ORG_ID, 'basic');

    expect(mockFrom).toHaveBeenCalledWith('org_entitlements');
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    const [records, options] = mockUpsert.mock.calls[0];

    expect(options).toEqual({ onConflict: 'organization_id,feature_key' });

    expect(records).toEqual(
      expect.arrayContaining([
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'audit_export',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'reports',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'framework_evaluations',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'team_limit',
          enabled: true,
          limit_value: 15,
        },
      ]),
    );

    expect(records).toHaveLength(4);

    for (const record of records) {
      expect(record.organization_id).toBe(TEST_ORG_ID);
    }
  });

  it('upserts correct records for the pro plan', async () => {
    await syncEntitlementsForPlan(TEST_ORG_ID, 'pro');

    expect(mockFrom).toHaveBeenCalledWith('org_entitlements');
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    const [records, options] = mockUpsert.mock.calls[0];

    expect(options).toEqual({ onConflict: 'organization_id,feature_key' });

    expect(records).toEqual(
      expect.arrayContaining([
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'audit_export',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'reports',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'framework_evaluations',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'certifications',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'team_limit',
          enabled: true,
          limit_value: 75,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'ai_assistant',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'soc2_certification',
          enabled: true,
          limit_value: null,
        },
      ]),
    );

    expect(records).toHaveLength(7);

    for (const record of records) {
      expect(record.organization_id).toBe(TEST_ORG_ID);
    }
  });

  it('upserts correct records for the enterprise plan with unlimited team_limit', async () => {
    await syncEntitlementsForPlan(TEST_ORG_ID, 'enterprise');

    expect(mockFrom).toHaveBeenCalledWith('org_entitlements');
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    const [records, options] = mockUpsert.mock.calls[0];

    expect(options).toEqual({ onConflict: 'organization_id,feature_key' });

    const teamLimitRecord = records.find(
      (r: { feature_key: string }) => r.feature_key === 'team_limit',
    );
    expect(teamLimitRecord).toEqual({
      organization_id: TEST_ORG_ID,
      feature_key: 'team_limit',
      enabled: true,
      limit_value: null,
    });

    expect(records).toHaveLength(7);

    for (const record of records) {
      expect(record.organization_id).toBe(TEST_ORG_ID);
    }
  });

  it('uses the correct onConflict key for all plans', async () => {
    for (const plan of ['basic', 'pro', 'enterprise'] as const) {
      mockUpsert.mockClear();
      await syncEntitlementsForPlan(TEST_ORG_ID, plan);

      const [, options] = mockUpsert.mock.calls[0];
      expect(options).toEqual({ onConflict: 'organization_id,feature_key' });
    }
  });

  it('passes the orgId through to every record', async () => {
    const customOrgId = 'org_custom_xyz789';

    for (const plan of ['basic', 'pro', 'enterprise'] as const) {
      mockUpsert.mockClear();
      await syncEntitlementsForPlan(customOrgId, plan);

      const [records] = mockUpsert.mock.calls[0];
      for (const record of records) {
        expect(record.organization_id).toBe(customOrgId);
      }
    }
  });
});
