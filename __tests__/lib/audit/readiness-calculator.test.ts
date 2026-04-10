/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/frameworks/framework-installer', () => ({
  getFrameworkCodeForSlug: jest.fn((slug: string) => slug.toUpperCase()),
}));

import { calculateFrameworkReadiness } from '@/lib/audit/readiness-calculator';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function mockAdmin(
  frameworks: unknown[] = [],
  orgFrameworks: unknown[] | null = null,
  snapshots: unknown[] = [],
) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);

  const _fromCount = 0;

  const admin = {
    from: jest.fn((table: string) => {
      if (table === 'compliance_frameworks') {
        return {
          select: jest.fn().mockResolvedValue({ data: frameworks }),
        };
      }
      if (table === 'org_frameworks') {
        if (orgFrameworks === null) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockRejectedValue(new Error('no table')),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: orgFrameworks }),
          }),
        };
      }
      if (table === 'org_control_evaluations') {
        const c: Record<string, jest.Mock> = {};
        c.select = jest.fn().mockReturnValue(c);
        c.eq = jest.fn().mockReturnValue(c);
        c.order = jest.fn().mockResolvedValue({ data: snapshots });
        return c;
      }
      return chain;
    }),
  };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);
  return admin;
}

describe('lib/audit/readiness-calculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty when no frameworks', async () => {
    mockAdmin([], null, []);
    const result = await calculateFrameworkReadiness('org1');
    expect(result).toEqual([]);
  });

  it('returns readiness for frameworks with snapshots', async () => {
    mockAdmin([{ id: 'f1', code: 'SOC2', title: 'SOC 2 Type II' }], null, [
      {
        framework_id: 'f1',
        compliance_score: 75,
        total_controls: 100,
        satisfied_controls: 75,
        missing_controls: 15,
        partial_control_codes: ['CC1.1', 'CC2.3'],
        last_evaluated_at: '2026-01-15',
      },
    ]);

    const result = await calculateFrameworkReadiness('org1');
    expect(result).toHaveLength(1);
    expect(result[0].frameworkCode).toBe('SOC2');
    expect(result[0].readinessScore).toBe(75);
    expect(result[0].totalControls).toBe(100);
    expect(result[0].satisfiedControls).toBe(75);
    expect(result[0].missingControls).toBe(15);
    expect(result[0].partialControls).toBe(2);
  });

  it('returns 0 readiness when no snapshots exist', async () => {
    mockAdmin([{ id: 'f1', code: 'ISO27001', title: 'ISO 27001' }], null, []);

    const result = await calculateFrameworkReadiness('org1');
    expect(result).toHaveLength(1);
    expect(result[0].readinessScore).toBe(0);
    expect(result[0].totalControls).toBe(0);
    expect(result[0].evaluatedAt).toBeNull();
  });

  it('filters frameworks by enabled org frameworks', async () => {
    mockAdmin(
      [
        { id: 'f1', code: 'SOC2', title: 'SOC 2' },
        { id: 'f2', code: 'GDPR', title: 'GDPR' },
      ],
      [{ framework_slug: 'soc2' }],
      [],
    );

    const result = await calculateFrameworkReadiness('org1');
    expect(result).toHaveLength(1);
    expect(result[0].frameworkCode).toBe('SOC2');
  });

  it('falls back to full list when org_frameworks query fails', async () => {
    mockAdmin(
      [
        { id: 'f1', code: 'SOC2', title: 'SOC 2' },
        { id: 'f2', code: 'GDPR', title: 'GDPR' },
      ],
      null, // will throw
      [],
    );

    const result = await calculateFrameworkReadiness('org1');
    expect(result).toHaveLength(2);
  });
});
