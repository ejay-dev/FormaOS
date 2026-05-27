/** @jest-environment node */
/**
 * R10 Phase 3 (Audit 2026-05-27) — NDIS predicate tests for the new
 * automated paths against the schema additions in migration 20260624067
 * (org_policies.ndis_category column + org_behaviour_support_plans table).
 *
 * Covers the 10 controls converted from manual stubs to real predicates:
 *   - NDIS-1.3 Privacy and dignity (ndis_category=privacy)
 *   - NDIS-2.1 Governance (policy + COI register)
 *   - NDIS-2.4 Information management (3-part check)
 *   - NDIS-2.8 Continuity of supports (BCP register)
 *   - NDIS-3.1 Access to supports (intake register)
 *   - NDIS-3.3 Service agreements (form_submissions OR register)
 *   - NDIS-3.5 Transitions (register)
 *   - NDIS-4.1 Safe environment (register + freshness)
 *   - NDIS-4.2 Participant money + property (register)
 *   - NDIS-W.1 Worker engagement (register + freshness)
 *
 * Plus the Verification + Specialist module statutory paths:
 *   - NDIS-V.2 Restrictive practices oversight (BSP + RP-use register)
 *   - NDIS-M.2 Restrictive practices + consent
 *
 * And refined statutory paths:
 *   - NDIS-1.5 Safeguarding (24h/5bd reportable timing)
 *   - NDIS-2.6 Incident management (24h/5bd reportable timing)
 */

import {
  evaluatePrivacyAndDignity,
  evaluateGovernance,
  evaluateInformationManagement,
  evaluateContinuityOfSupports,
  evaluateAccessToSupports,
  evaluateServiceAgreements,
  evaluateTransitions,
  evaluateSafeEnvironment,
  evaluateParticipantMoneyAndProperty,
  evaluateWorkerEngagement,
  evaluateRestrictivePracticesOversight,
  evaluateRestrictivePracticesConsent,
  evaluateSafeguarding,
  evaluateIncidentManagement,
} from '@/lib/compliance/evaluators/ndis/_predicates';

const NOW = '2026-05-27T00:00:00.000Z';
const ORG_ID = '00000000-0000-0000-0000-000000000abc';

// Reusable mock factory supporting chained .eq() / .gte() / .or() etc.
function mockDb(routes: Record<string, { data?: unknown[]; error?: unknown; count?: number }>) {
  return {
    from: (table: string) => {
      const route = routes[table];
      if (route === undefined) {
        throw new Error(`mockDb: table '${table}' not mocked`);
      }
      const result = {
        data: route.data ?? null,
        error: route.error ?? null,
        count: route.count ?? null,
      };
      const chain: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'gte', 'lte', 'in', 'is', 'not', 'or', 'order', 'limit']) {
        chain[m] = jest.fn(() => chain);
      }
      chain.maybeSingle = jest.fn(() => result);
      chain.single = jest.fn(() => result);
      Object.defineProperty(chain, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(result),
        writable: true,
        configurable: true,
      });
      return chain;
    },
  };
}

// ============================================================================
// NDIS-1.3 Privacy and dignity
// ============================================================================

describe('NDIS-1.3 — Privacy and dignity', () => {
  it('fails when no privacy policy tagged', async () => {
    const db = mockDb({ org_policies: { data: [] } });
    const r = await evaluatePrivacyAndDignity({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('fail');
    expect(r.gaps[0].code).toBe('no_privacy_policy');
  });

  it('partial when policy exists but stale (>12 months)', async () => {
    const oldDate = new Date(Date.now() - 400 * 86_400_000).toISOString();
    const db = mockDb({
      org_policies: { data: [{ id: 'p1', status: 'published', updated_at: oldDate, ndis_category: 'privacy' }] },
    });
    const r = await evaluatePrivacyAndDignity({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
  });

  it('passes when current published privacy policy exists', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_policies: { data: [{ id: 'p1', status: 'published', updated_at: fresh, ndis_category: 'privacy' }] },
    });
    const r = await evaluatePrivacyAndDignity({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });
});

// ============================================================================
// NDIS-2.1 Governance
// ============================================================================

describe('NDIS-2.1 — Governance', () => {
  it('fails when neither policy nor COI register present', async () => {
    const db = mockDb({ org_policies: { data: [] }, org_registers: { data: [] } });
    const r = await evaluateGovernance({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('fail');
  });

  it('partial when only one of the two present', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_policies: { data: [{ id: 'p1', status: 'published', updated_at: fresh }] },
      org_registers: { data: [] },
    });
    const r = await evaluateGovernance({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
  });

  it('passes when both policy + COI register present', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_policies: { data: [{ id: 'p1', status: 'published', updated_at: fresh }] },
      org_registers: { data: [{ id: 'r1', type: 'conflict_of_interest', status: 'active', updated_at: fresh }] },
    });
    const r = await evaluateGovernance({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });
});

// ============================================================================
// NDIS-2.4 Information management (3-part check)
// ============================================================================

describe('NDIS-2.4 — Information management', () => {
  it('fails when all 3 inputs absent', async () => {
    const db = mockDb({
      org_policies: { data: [] },
      retention_policies: { data: [] },
      audit_log: { count: 0 },
    });
    const r = await evaluateInformationManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('fail');
  });

  it('partial when 1 of 3 present', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_policies: { data: [{ id: 'p1', status: 'published', updated_at: fresh }] },
      retention_policies: { data: [] },
      audit_log: { count: 0 },
    });
    const r = await evaluateInformationManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
  });

  it('passes when all 3 satisfied', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_policies: { data: [{ id: 'p1', status: 'published', updated_at: fresh }] },
      retention_policies: { data: [{ id: 'rp1', is_active: true }] },
      audit_log: { count: 100 },
    });
    const r = await evaluateInformationManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });
});

// ============================================================================
// NDIS-2.8 Continuity of supports
// ============================================================================

describe('NDIS-2.8 — Continuity of supports', () => {
  it('fails when no BCP entry', async () => {
    const db = mockDb({ org_registers: { data: [] } });
    const r = await evaluateContinuityOfSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('fail');
  });

  it('passes when BCP reviewed within 12 months', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_registers: { data: [{ id: 'b1', type: 'business_continuity_plan', status: 'active', updated_at: fresh }] },
    });
    const r = await evaluateContinuityOfSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });

  it('partial when BCP stale (>12 months)', async () => {
    const stale = new Date(Date.now() - 400 * 86_400_000).toISOString();
    const db = mockDb({
      org_registers: { data: [{ id: 'b1', type: 'business_continuity_plan', status: 'active', updated_at: stale }] },
    });
    const r = await evaluateContinuityOfSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
  });
});

// ============================================================================
// NDIS-3.1, 3.5, 4.2 — Simple "register entry exists" predicates
// ============================================================================

describe('NDIS-3.1 — Access to supports', () => {
  it('manual-attests when no intake entries', async () => {
    const db = mockDb({ org_registers: { data: [] } });
    const r = await evaluateAccessToSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('not_evaluated');
  });
  it('passes when intake records present', async () => {
    const db = mockDb({
      org_registers: { data: [{ id: 'i1', type: 'intake', updated_at: NOW }] },
    });
    const r = await evaluateAccessToSupports({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });
});

describe('NDIS-3.5 — Transitions', () => {
  it('passes when transition records present', async () => {
    const db = mockDb({
      org_registers: { data: [{ id: 't1', type: 'transition', updated_at: NOW }] },
    });
    const r = await evaluateTransitions({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });
});

describe('NDIS-4.2 — Participant money/property', () => {
  it('passes when financial-delegation register present', async () => {
    const db = mockDb({
      org_registers: { data: [{ id: 'f1', type: 'financial_delegation', updated_at: NOW }] },
    });
    const r = await evaluateParticipantMoneyAndProperty({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });
});

// ============================================================================
// NDIS-3.3 Service agreements (two-source check)
// ============================================================================

describe('NDIS-3.3 — Service agreements', () => {
  it('manual when no signed forms and no register entries', async () => {
    const db = mockDb({ org_form_submissions: { data: [] }, org_registers: { data: [] } });
    const r = await evaluateServiceAgreements({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('not_evaluated');
  });

  it('passes when register entries present even without forms', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_form_submissions: { data: [] },
      org_registers: { data: [{ id: 'sa1', type: 'service_agreement', status: 'active', updated_at: fresh }] },
    });
    const r = await evaluateServiceAgreements({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });

  it('passes when tagged form_submissions present', async () => {
    const db = mockDb({
      org_form_submissions: {
        data: [{ id: 'f1', status: 'reviewed', metadata: { form_type: 'service_agreement' }, reviewed_at: NOW, created_at: NOW }],
      },
      org_registers: { data: [] },
    });
    const r = await evaluateServiceAgreements({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('pass');
  });
});

// ============================================================================
// NDIS-4.1 Safe environment + NDIS-W.1 Worker engagement (cadence checks)
// ============================================================================

describe('NDIS-4.1 — Safe environment', () => {
  it('partial when assessments exist but some stale', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const stale = new Date(Date.now() - 400 * 86_400_000).toISOString();
    const db = mockDb({
      org_registers: {
        data: [
          { id: 'e1', type: 'environment_assessment', updated_at: fresh },
          { id: 'e2', type: 'environment_assessment', updated_at: stale },
        ],
      },
    });
    const r = await evaluateSafeEnvironment({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
  });
});

describe('NDIS-W.1 — Worker engagement', () => {
  it('partial when supervision records exist but some stale (>6mo)', async () => {
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const stale = new Date(Date.now() - 200 * 86_400_000).toISOString();
    const db = mockDb({
      org_registers: {
        data: [
          { id: 's1', type: 'supervision', updated_at: fresh },
          { id: 's2', type: 'supervision', updated_at: stale },
        ],
      },
    });
    const r = await evaluateWorkerEngagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
  });
});

// ============================================================================
// NDIS-V.2 + NDIS-M.2 (statutory BSP lifecycle)
// ============================================================================

describe('NDIS-V.2 — Restrictive practices oversight', () => {
  it('manual when no RP use AND no BSPs (control may not apply)', async () => {
    const db = mockDb({ org_behaviour_support_plans: { data: [] }, org_registers: { data: [] } });
    const r = await evaluateRestrictivePracticesOversight({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('not_evaluated');
  });

  it('fails when RP use recorded but no BSPs (statutory breach: interim BSP required within 1 month)', async () => {
    const recentRpUse = new Date(Date.now() - 35 * 86_400_000).toISOString();
    const db = mockDb({
      org_behaviour_support_plans: { data: [] },
      org_registers: { data: [{ id: 'rp1', type: 'restrictive_practice_use', status: 'recorded', created_at: recentRpUse, updated_at: recentRpUse }] },
    });
    const r = await evaluateRestrictivePracticesOversight({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('fail');
    expect(r.gaps.some((g) => g.code === 'late_interim_bsp')).toBe(true);
  });
});

describe('NDIS-M.2 — Restrictive practices + consent', () => {
  it('manual when no comprehensive BSPs (control may not apply)', async () => {
    const db = mockDb({ org_behaviour_support_plans: { data: [] }, org_form_submissions: { data: [] } });
    const r = await evaluateRestrictivePracticesConsent({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('not_evaluated');
  });

  it('partial when BSPs exist but consent forms absent', async () => {
    const db = mockDb({
      org_behaviour_support_plans: {
        data: [{ id: 'b1', participant_id: 'p1', plan_type: 'comprehensive', status: 'authorised', authorised_at: NOW }],
      },
      org_form_submissions: { data: [] },
    });
    const r = await evaluateRestrictivePracticesConsent({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
  });
});

// ============================================================================
// NDIS-1.5 + NDIS-2.6 statutory reportable-incident timing checks (Phase 3)
// ============================================================================

describe('NDIS-1.5 — Safeguarding (statutory 24h/5bd reportable timing)', () => {
  it('fails on unsubmitted reportable notifications', async () => {
    const recent = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const db = mockDb({
      org_incidents: { data: [{ id: 'i1', severity: 'high', status: 'open', created_at: recent }] },
      org_regulatory_notifications: { data: [{ id: 'n1', submitted_at: null, status: 'draft', created_at: recent }] },
      org_policies: { data: [] },
    });
    const r = await evaluateSafeguarding({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('fail');
    expect(r.gaps.some((g) => g.code === 'unsubmitted_reportable_notifications')).toBe(true);
  });

  it('partial when reportable submitted late (>5 business days after creation)', async () => {
    const created = new Date(Date.now() - 20 * 86_400_000).toISOString();
    const submitted = new Date(Date.now() - 10 * 86_400_000).toISOString(); // 10 days after
    const fresh = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = mockDb({
      org_incidents: { data: [{ id: 'i1', severity: 'medium', status: 'closed', created_at: created }] },
      org_regulatory_notifications: { data: [{ id: 'n1', submitted_at: submitted, status: 'submitted', created_at: created }] },
      org_policies: { data: [{ id: 'p1', status: 'published', updated_at: fresh }] },
    });
    const r = await evaluateSafeguarding({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('partial');
    expect(r.gaps.some((g) => g.code === 'late_reportable_submission')).toBe(true);
  });
});

describe('NDIS-2.6 — Incident management (statutory)', () => {
  it('fails when notifications drafted but unsubmitted', async () => {
    const recent = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const db = mockDb({
      org_incidents: { data: [{ id: 'i1', severity: 'medium', status: 'open', created_at: recent }] },
      org_regulatory_notifications: { data: [{ id: 'n1', submitted_at: null, status: 'draft', created_at: recent }] },
      org_policies: { data: [] },
    });
    const r = await evaluateIncidentManagement({ orgId: ORG_ID, db: db as never }, NOW);
    expect(r.status).toBe('fail');
  });
});
