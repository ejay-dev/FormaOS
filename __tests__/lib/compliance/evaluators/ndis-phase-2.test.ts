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

  it('returns pass when ≥95% care plans reviewed within 12 months (Phase 3 threshold)', async () => {
    const recent = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_care_plans: {
        result: {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `plan-${i}`,
            status: 'active',
            updated_at: recent, // 10/10 fresh = 100% (above 95% pass threshold)
          })),
          error: null,
        },
      },
    });
    const result = await evaluatePersonCentredSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('pass');
  });

  it('returns partial when 70% ≤ ratio < 95% (Phase 3 partial band)', async () => {
    const recent = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const stale = new Date(Date.now() - 400 * 86_400_000).toISOString();
    const db = mockDb({
      org_care_plans: {
        result: {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `plan-${i}`,
            status: 'active',
            updated_at: i < 9 ? recent : stale, // 9/10 fresh = 90% → partial band
          })),
          error: null,
        },
      },
    });
    const result = await evaluatePersonCentredSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(result.status).toBe('partial');
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

describe('NDIS-3.4 — Responsive support provision (Phase 3 per-participant)', () => {
  // The predicate makes up to three sequential queries:
  //   1. org_progress_notes count (90d)            → head: true
  //   2. org_patients filtered to care_status=active
  //   3. org_progress_notes detail rows (30d)
  // ndis34Db() routes each by table + by whether the chain is a count
  // query (head:true) vs. a data fetch.
  function ndis34Db(opts: {
    orgWideCount: number;
    activeParticipants: Array<{ id: string; full_name: string | null }>;
    notedPatientIds: Set<string>;
    participantsError?: { message: string } | null;
  }) {
    return {
      from: (table: string) => {
        if (table === 'org_progress_notes') {
          const baseChain: Record<string, unknown> = {};
          // head:true count chain
          baseChain.select = jest.fn((_cols: string, options?: { count?: string; head?: boolean }) => {
            if (options?.head) {
              return {
                eq: () => ({
                  gte: () =>
                    Promise.resolve({ count: opts.orgWideCount, error: null }),
                }),
              };
            }
            // recent-notes data chain (no head)
            return {
              eq: () => ({
                gte: () =>
                  Promise.resolve({
                    data: Array.from(opts.notedPatientIds).map((pid) => ({
                      id: `n-${pid}`,
                      patient_id: pid,
                    })),
                    error: null,
                  }),
              }),
            };
          });
          return baseChain;
        }
        if (table === 'org_patients') {
          return {
            select: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: opts.participantsError ? null : opts.activeParticipants,
                    error: opts.participantsError ?? null,
                  }),
              }),
            }),
          };
        }
        throw new Error(`ndis34Db: unexpected table ${table}`);
      },
    } as never;
  }

  it('returns fail when zero progress notes in 90 days', async () => {
    const db = ndis34Db({
      orgWideCount: 0,
      activeParticipants: [],
      notedPatientIds: new Set(),
    });
    const result = await evaluateResponsiveSupport({ orgId: ORG_ID, db }, NOW);
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('no_progress_notes');
  });

  it('returns pass when every active participant has ≥1 note in 30d AND ≥30/90d org-wide', async () => {
    const participants = Array.from({ length: 5 }, (_, i) => ({
      id: `p-${i}`,
      full_name: `Participant ${i}`,
    }));
    const result = await evaluateResponsiveSupport(
      {
        orgId: ORG_ID,
        db: ndis34Db({
          orgWideCount: 40,
          activeParticipants: participants,
          notedPatientIds: new Set(participants.map((p) => p.id)),
        }),
      },
      NOW,
    );
    expect(result.status).toBe('pass');
    expect(result.gaps).toHaveLength(0);
  });

  it('returns partial when one participant is silent (silentRatio ≤ 50%)', async () => {
    const participants = Array.from({ length: 5 }, (_, i) => ({
      id: `p-${i}`,
      full_name: `Participant ${i}`,
    }));
    const result = await evaluateResponsiveSupport(
      {
        orgId: ORG_ID,
        db: ndis34Db({
          orgWideCount: 40,
          activeParticipants: participants,
          notedPatientIds: new Set(['p-0', 'p-1', 'p-2', 'p-3']), // p-4 silent
        }),
      },
      NOW,
    );
    expect(result.status).toBe('partial');
    expect(result.gaps[0].code).toBe('silent_participants_30d');
    expect(result.gaps[0].severity).toBe('medium');
  });

  it('returns fail when >50% of active participants are silent', async () => {
    const participants = Array.from({ length: 4 }, (_, i) => ({
      id: `p-${i}`,
      full_name: `Participant ${i}`,
    }));
    const result = await evaluateResponsiveSupport(
      {
        orgId: ORG_ID,
        db: ndis34Db({
          orgWideCount: 40,
          activeParticipants: participants,
          notedPatientIds: new Set(['p-0']), // 3/4 = 75% silent → high severity + fail
        }),
      },
      NOW,
    );
    expect(result.status).toBe('fail');
    expect(result.gaps[0].severity).toBe('high');
  });

  it('falls back to org-wide threshold when org_patients lookup errors (non-care orgs)', async () => {
    const result = await evaluateResponsiveSupport(
      {
        orgId: ORG_ID,
        db: ndis34Db({
          orgWideCount: 30,
          activeParticipants: [],
          notedPatientIds: new Set(),
          participantsError: { message: 'permission denied for table org_patients' },
        }),
      },
      NOW,
    );
    expect(result.status).toBe('pass'); // 30 ≥ 30 → pass
    expect(result.reason).toContain('participant table unavailable');
  });

  it('falls back to org-wide threshold when zero active participants on file', async () => {
    const result = await evaluateResponsiveSupport(
      {
        orgId: ORG_ID,
        db: ndis34Db({
          orgWideCount: 12,
          activeParticipants: [],
          notedPatientIds: new Set(),
        }),
      },
      NOW,
    );
    expect(result.status).toBe('partial'); // 12 < 30 → partial via fallback
    expect(result.reason).toContain('0 active participants on file');
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
