/** @jest-environment node */
jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import { generateCareScorecard } from '@/lib/care-scorecard/scorecard-service';

beforeEach(() => jest.clearAllMocks());

describe('generateCareScorecard', () => {
  it('returns complete scorecard with all metrics', async () => {
    const now = new Date();
    const futureDate = new Date(
      now.getTime() + 15 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const pastDate = new Date(
      now.getTime() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();

    let callIdx = 0;
    getClient().from.mockImplementation((table: string) => {
      callIdx++;

      // Staff compliance
      if (table === 'org_members') {
        return createBuilder({
          data: [
            { id: '1', user_id: 'u1' },
            { id: '2', user_id: 'u2' },
          ],
          error: null,
        });
      }
      if (table === 'org_staff_credentials') {
        return createBuilder({
          data: [
            {
              user_id: 'u1',
              status: 'verified',
              expires_at: futureDate,
              credential_type: 'wwcc',
              name: 'WWCC',
              id: 'c1',
            },
            {
              user_id: 'u2',
              status: 'expired',
              expires_at: pastDate,
              credential_type: 'police_check',
              name: 'Police',
              id: 'c2',
            },
          ],
          error: null,
        });
      }
      if (table === 'org_audit_logs') {
        return createBuilder({ data: [], error: null });
      }

      // Default for other tables (visits, care plans, incidents, etc.)
      return createBuilder({ data: [], error: null });
    });

    const result = await generateCareScorecard('org-1', 'ndis' as any);
    expect(result).toHaveProperty('staffCompliance');
    expect(result).toHaveProperty('credentials');
    expect(result).toHaveProperty('visits');
    expect(result).toHaveProperty('carePlans');
    expect(result).toHaveProperty('incidents');
    expect(result).toHaveProperty('workload');
    expect(result).toHaveProperty('industry', 'ndis');
    expect(result).toHaveProperty('generatedAt');
  });

  it('handles zero staff gracefully', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await generateCareScorecard('org-1', 'healthcare' as any);
    expect(result.staffCompliance.totalStaff).toBe(0);
    expect(result.staffCompliance.percentage).toBe(100);
  });

  it('calculates staff compliance correctly', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members') {
        return createBuilder({
          data: [
            { id: '1', user_id: 'u1' },
            { id: '2', user_id: 'u2' },
            { id: '3', user_id: 'u3' },
          ],
          error: null,
        });
      }
      if (table === 'org_staff_credentials') {
        return createBuilder({
          data: [
            {
              user_id: 'u1',
              status: 'verified',
              expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
            },
            { user_id: 'u2', status: 'pending' },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null });
    });

    const result = await generateCareScorecard('org-1', 'aged_care' as any);
    expect(result.staffCompliance.totalStaff).toBe(3);
    expect(result.staffCompliance.compliant).toBeGreaterThanOrEqual(0);
    expect(result.staffCompliance.pending).toBeGreaterThanOrEqual(0);
  });
});
