/** @jest-environment node */
/**
 * R10 Phase 2 (Audit 2026-05-27) — NDIS predicate-level tests.
 *
 * Each test drives the predicate with a small in-memory fixture set via
 * a mock Supabase client. We're testing the verdict logic, not the
 * underlying queries — Phase 3 with an NDIS-audit expert should add
 * golden-data integration tests once predicate semantics are signed off.
 */

import {
  evaluatePersonCentredSupports,
  evaluateRiskManagement,
  evaluateInformationManagement,
  evaluateComplaintsManagement,
  evaluateResponsiveSupport,
  evaluateSupportPlanning,
  evaluateQualityManagement,
  evaluateHrManagement,
} from '@/lib/compliance/evaluators/ndis/_predicates';

const NOW = '2026-05-27T00:00:00.000Z';
const ORG_ID = '00000000-0000-0000-0000-000000000abc';

function mockDb(routes: Record<string, unknown>) {
  return {
    from: (table: string) => {
      const data = routes[table];
      if (data === undefined) {
        throw new Error(`mockDb: table '${table}' not mocked`);
      }
      const chain: Record<string, unknown> = {};
      const recoverable = {
        ...(typeof data === 'object' && data !== null && 'result' in data
          ? (data as { result: unknown }).result
          : { data, error: null }),
      };
      chain.select = jest.fn(() => chain);
      chain.eq = jest.fn(() => chain);
      chain.gte = jest.fn(() => chain);
      chain.lte = jest.fn(() => chain);
      chain.in = jest.fn(() => chain);
      chain.or = jest.fn(() => chain);
      chain.order = jest.fn(() => chain);
      chain.limit = jest.fn(() => chain);
      chain.maybeSingle = jest.fn(() => recoverable);
      chain.single = jest.fn(() => recoverable);
      // Final await on the chain resolves to recoverable
      Object.defineProperty(chain, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(recoverable),
        writable: true,
        configurable: true,
      });
      return chain;
    },
  };
}

describe('NDIS-1.1 — Person-centred supports', () => {
  it('returns manual-attestation when no care plans exist', async () => {
    const db = mockDb({
      org_care_plans: { result: { data: [], error: null } },
    });
    const result = await evaluatePersonCentredSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('manual_attestation_required');
  });

  it('returns pass when ≥90% care plans reviewed within 180 days', async () => {
    const recent = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const stale = new Date(Date.now() - 365 * 86_400_000).toISOString();
    const db = mockDb({
      org_care_plans: {
        result: {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `plan-${i}`,
            status: 'active',
            updated_at: i < 9 ? recent : stale, // 9 of 10 fresh = 90%
          })),
          error: null,
        },
      },
    });
    const result = await evaluatePersonCentredSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('pass');
  });

  it('returns fail when <70% care plans are fresh (Phase 3: 12mo threshold per NDIS standard)', async () => {
    // Stale = >12 months old (Phase 3 statutory threshold per NDIS Practice
    // Standards Nov 2021 v4). Fresh = within 12 months.
    const stale = new Date(Date.now() - 400 * 86_400_000).toISOString();
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_care_plans: {
        result: {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `plan-${i}`,
            status: 'active',
            updated_at: i < 3 ? fresh : stale, // 30% fresh
          })),
          error: null,
        },
      },
    });
    const result = await evaluatePersonCentredSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('fail');
  });
});

describe('NDIS-2.2 — Risk management', () => {
  it('returns fail when register is empty', async () => {
    const db = mockDb({
      org_risks: { result: { data: [], error: null } },
    });
    const result = await evaluateRiskManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('no_risk_register');
  });

  it('returns pass when ≥80% of risks reviewed within 90 days', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const stale = new Date(Date.now() - 200 * 86_400_000).toISOString();
    const db = mockDb({
      org_risks: {
        result: {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `risk-${i}`,
            status: 'open',
            updated_at: i < 8 ? fresh : stale, // 80% fresh
          })),
          error: null,
        },
      },
    });
    const result = await evaluateRiskManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('pass');
  });
});

describe('NDIS-2.4 — Information management (Phase 3 3-part check)', () => {
  // Phase 3 changed evaluateInformationManagement to read 3 sources:
  // org_policies (ndis_category='information_management'), retention_policies,
  // and audit_log count. Tests moved to ndis-phase-3.test.ts.
});

describe('NDIS-2.5 — Complaints management', () => {
  it('returns partial (under-reporting suspicion) when no complaints', async () => {
    const db = mockDb({
      org_registers: { result: { data: [], error: null } },
    });
    const result = await evaluateComplaintsManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('partial');
    expect(result.gaps[0].code).toBe('no_complaints');
  });

  it('returns partial when complaints open >30 days exist', async () => {
    const oldOpen = new Date(Date.now() - 60 * 86_400_000).toISOString();
    const db = mockDb({
      org_registers: {
        result: {
          data: [{
            id: 'c1', type: 'complaint', category: null,
            status: 'open', created_at: oldOpen, updated_at: oldOpen, risk_level: 'medium',
          }],
          error: null,
        },
      },
    });
    const result = await evaluateComplaintsManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'open_complaints_over_30d')).toBe(true);
  });
});

describe('NDIS-3.4 — Responsive support provision', () => {
  it('returns fail when zero progress notes in 90 days', async () => {
    const db = {
      from: (_table: string) => ({
        select: () => ({
          eq: () => ({
            gte: () => Promise.resolve({ count: 0, error: null }),
          }),
        }),
      }),
    } as never;
    const result = await evaluateResponsiveSupport({ orgId: ORG_ID, db }, NOW);
    expect(result.status).toBe('fail');
  });

  it('returns pass when ≥30 progress notes in 90 days', async () => {
    const db = {
      from: (_table: string) => ({
        select: () => ({
          eq: () => ({
            gte: () => Promise.resolve({ count: 30, error: null }),
          }),
        }),
      }),
    } as never;
    const result = await evaluateResponsiveSupport({ orgId: ORG_ID, db }, NOW);
    expect(result.status).toBe('pass');
  });
});

describe('NDIS-3.2 — Support planning', () => {
  it('returns pass when ≥90% care plans have goals', async () => {
    const db = mockDb({
      org_care_plans: {
        result: {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `plan-${i}`,
            status: 'active',
            updated_at: NOW,
          })),
          error: null,
        },
      },
      org_care_goals: {
        result: {
          data: Array.from({ length: 9 }, (_, i) => ({
            id: `g-${i}`,
            care_plan_id: `plan-${i}`,
          })),
          error: null,
        },
      },
    });
    const result = await evaluateSupportPlanning({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('pass');
  });
});

describe('NDIS-2.3 — Quality management', () => {
  it('returns manual-attestation when no CAPA items in last 6 months', async () => {
    const db = mockDb({
      org_capa_items: { result: { data: [], error: null } },
    });
    const result = await evaluateQualityManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('not_evaluated');
  });

  it('returns partial when overdue CAPA items exist', async () => {
    const past = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);
    const db = mockDb({
      org_capa_items: {
        result: {
          data: [{
            id: 'capa-1', status: 'open', due_date: past,
            severity: 'medium', created_at: NOW, updated_at: NOW,
          }],
          error: null,
        },
      },
    });
    const result = await evaluateQualityManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('partial');
  });
});

describe('NDIS-2.7 — HR management (at_risk_credentials)', () => {
  it('returns pass when no at-risk credentials', async () => {
    const db = mockDb({
      at_risk_credentials: { result: { data: [], error: null } },
    });
    const result = await evaluateHrManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('pass');
  });

  it('returns fail when any expired credential exists', async () => {
    const past = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const db = mockDb({
      at_risk_credentials: {
        result: {
          data: [{ id: 'cred-1', user_id: 'u1', expiry_date: past }],
          error: null,
        },
      },
    });
    const result = await evaluateHrManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('fail');
  });

  it('returns partial when at-risk credential is not yet expired', async () => {
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const db = mockDb({
      at_risk_credentials: {
        result: {
          data: [{ id: 'cred-1', user_id: 'u1', expiry_date: future }],
          error: null,
        },
      },
    });
    const result = await evaluateHrManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('partial');
  });
});
