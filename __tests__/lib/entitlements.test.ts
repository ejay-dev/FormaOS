/**
 * @jest-environment node
 */

const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockEqAfterUpdate = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqAfterUpdate });
const mockFrom = jest.fn().mockReturnValue({
  upsert: mockUpsert,
  update: mockUpdate,
});

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

import {
  disableEntitlementsForOrg,
  syncEntitlementsForPlan,
} from '@/lib/billing/entitlements';

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
          limit_value: 10,
        },
      ]),
    );

    // Every entitlement key is now emitted: the 4 the basic plan grants are
    // enabled, the rest are explicitly disabled so a downgrade INTO basic
    // revokes higher-tier features instead of leaving them stuck enabled.
    expect(records).toHaveLength(13);

    // Features the basic plan does NOT include must be present as enabled=false.
    for (const absent of [
      'ai_assistant',
      'capa_management',
      'custom_reports',
      'form_analytics',
      'workflow_automation',
      'sso_saml',
      'directory_sync',
      'retention_governance',
      'certifications',
    ]) {
      expect(records).toContainEqual({
        organization_id: TEST_ORG_ID,
        feature_key: absent,
        enabled: false,
        limit_value: null,
      });
    }

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
          limit_value: 25,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'ai_assistant',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'capa_management',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'custom_reports',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'form_analytics',
          enabled: true,
          limit_value: null,
        },
      ]),
    );

    // 9 granted (enabled) + 4 not-in-plan (disabled) = all 13 keys emitted.
    expect(records).toHaveLength(13);

    // The four Scale/Enterprise-only features must be disabled under Pro, so a
    // downgrade from a higher tier actually revokes them.
    for (const absent of [
      'workflow_automation',
      'sso_saml',
      'directory_sync',
      'retention_governance',
    ]) {
      expect(records).toContainEqual({
        organization_id: TEST_ORG_ID,
        feature_key: absent,
        enabled: false,
        limit_value: null,
      });
    }

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

    expect(records).toEqual(
      expect.arrayContaining([
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'workflow_automation',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'sso_saml',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'directory_sync',
          enabled: true,
          limit_value: null,
        },
        {
          organization_id: TEST_ORG_ID,
          feature_key: 'retention_governance',
          enabled: true,
          limit_value: null,
        },
      ]),
    );

    expect(records).toHaveLength(13);

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

describe('disableEntitlementsForOrg', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockUpdate.mockClear();
    mockEqAfterUpdate.mockClear();
  });

  it('disables every entitlement row for the org', async () => {
    await disableEntitlementsForOrg(TEST_ORG_ID);

    expect(mockFrom).toHaveBeenCalledWith('org_entitlements');
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const [patch] = mockUpdate.mock.calls[0];
    expect(patch.enabled).toBe(false);
    expect(typeof patch.updated_at).toBe('string');

    expect(mockEqAfterUpdate).toHaveBeenCalledWith(
      'organization_id',
      TEST_ORG_ID,
    );
  });
});
