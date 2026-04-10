/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import { buildComplianceContext } from '@/lib/ai/compliance-context';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

describe('lib/ai/compliance-context', () => {
  beforeEach(() => jest.clearAllMocks());

  it('builds context string with org data', async () => {
    const admin = {
      from: jest.fn((table: string) => {
        const chain: Record<string, jest.Mock> = {};
        chain.select = jest.fn().mockReturnValue(chain);
        chain.eq = jest.fn().mockReturnValue(chain);
        chain.order = jest.fn().mockReturnValue(chain);
        chain.limit = jest.fn().mockReturnValue(chain);
        chain.maybeSingle = jest.fn();

        if (table === 'organizations') {
          chain.maybeSingle.mockResolvedValue({
            data: { name: 'TestOrg', industry: 'Healthcare' },
          });
          return chain;
        }
        if (table === 'org_control_evaluations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  { status: 'satisfied' },
                  { status: 'satisfied' },
                  { status: 'partial' },
                  { status: 'missing' },
                ],
              }),
            }),
          };
        }
        if (table === 'org_policies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  { title: 'AUP', status: 'published' },
                  { title: 'Draft', status: 'draft' },
                ],
              }),
            }),
          };
        }
        if (table === 'org_evidence') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ status: 'verified' }, { status: 'pending' }],
              }),
            }),
          };
        }
        if (table === 'org_frameworks') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ framework_key: 'SOC2', enabled: true }],
                }),
              }),
            }),
          };
        }
        if (table === 'soc2_readiness_assessments') {
          chain.maybeSingle.mockResolvedValue({ data: { overall_score: 72 } });
          return chain;
        }
        return chain;
      }),
    };
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const ctx = await buildComplianceContext('org1');
    expect(ctx).toContain('TestOrg');
    expect(ctx).toContain('Healthcare');
    expect(ctx).toContain('SOC2');
    expect(ctx).toContain('72%');
    expect(ctx).toContain('2 satisfied');
  });

  it('handles missing org data gracefully', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockReturnValue(chain);
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null });
    const admin = { from: jest.fn().mockReturnValue(chain) };
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const ctx = await buildComplianceContext('org-empty');
    expect(ctx).toContain('Unknown Organization');
    expect(ctx).toContain('Not specified');
    expect(ctx).toContain('None enabled');
  });
});
