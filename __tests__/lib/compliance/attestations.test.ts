/**
 * Tests for lib/compliance/attestations.ts
 *
 * Three things the helpers must guarantee:
 *   1. listControlsNeedingAttestation only returns rows whose
 *      evaluator emitted `gap.code === 'manual_attestation_required'`.
 *      A pass/fail evaluation that happens to have status='not_evaluated'
 *      for an unrelated reason must NOT show up.
 *   2. updateAttestationReview throws when the reviewer is the same
 *      user who claimed (defense-in-depth alongside the DB CHECK
 *      constraint from migration 20260624021).
 *   3. updateAttestationReview throws when decision='reject' but no
 *      reason is supplied.
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'not', 'is',
    'order', 'limit', 'single', 'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const fromMock = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: fromMock }),
}));

import {
  listControlsNeedingAttestation,
  updateAttestationReview,
  MANUAL_GAP_CODE,
} from '@/lib/compliance/attestations';

beforeEach(() => {
  fromMock.mockReset();
});

describe('listControlsNeedingAttestation', () => {
  it('returns only rows whose details.gaps contains manual_attestation_required', async () => {
    const evalBuilder = createBuilder({
      data: [
        {
          framework_id: 'fw-1',
          control_key: 'A.5.6',
          details: {
            code: 'A.5.6',
            title: 'Threat intelligence',
            evaluator: {
              reason: 'Needs SIG attestation.',
              gap_codes: [MANUAL_GAP_CODE],
            },
          },
        },
        {
          framework_id: 'fw-1',
          control_key: 'A.8.1',
          // not_evaluated for a different reason — must be filtered out
          details: {
            code: 'A.8.1',
            title: 'User endpoint devices',
            evaluator: {
              reason: 'DB read failed.',
              gap_codes: ['org_policies_unavailable'],
            },
          },
        },
      ],
      error: null,
    });
    const frameworkBuilder = createBuilder({
      data: [{ id: 'fw-1', name: 'ISO 27001' }],
      error: null,
    });
    const attestationBuilder = createBuilder({ data: [], error: null });

    fromMock
      .mockReturnValueOnce(evalBuilder) // org_control_evaluations
      .mockReturnValueOnce(frameworkBuilder) // compliance_frameworks
      .mockReturnValueOnce(attestationBuilder); // org_control_attestations

    const rows = await listControlsNeedingAttestation('org-1');

    expect(rows).toHaveLength(1);
    expect(rows[0].controlKey).toBe('A.5.6');
    expect(rows[0].frameworkName).toBe('ISO 27001');
    expect(rows[0].message).toBe('Needs SIG attestation.');
    expect(rows[0].latestAttestation).toBeNull();
  });

  it('attaches the latest attestation per (framework, control) and orders DESC by claimed_at', async () => {
    const evalBuilder = createBuilder({
      data: [
        {
          framework_id: 'fw-1',
          control_key: 'A.5.6',
          details: {
            code: 'A.5.6',
            title: 'Threat intelligence',
            evaluator: { reason: 'x', gap_codes: [MANUAL_GAP_CODE] },
          },
        },
      ],
      error: null,
    });
    const frameworkBuilder = createBuilder({
      data: [{ id: 'fw-1', name: 'ISO 27001' }],
      error: null,
    });
    const attestationBuilder = createBuilder({
      data: [
        // Latest (claimed_at DESC ordering preserved by helper)
        {
          id: 'att-2',
          organization_id: 'org-1',
          framework_id: 'fw-1',
          control_key: 'A.5.6',
          status: 'claimed',
          claimed_by: 'user-2',
          claimed_at: '2026-05-20T00:00:00Z',
          reviewed_by: null,
          reviewed_at: null,
          rejected_reason: null,
          evidence_id: 'ev-2',
          notes: null,
          created_at: '2026-05-20T00:00:00Z',
          updated_at: '2026-05-20T00:00:00Z',
        },
        {
          id: 'att-1',
          organization_id: 'org-1',
          framework_id: 'fw-1',
          control_key: 'A.5.6',
          status: 'rejected',
          claimed_by: 'user-1',
          claimed_at: '2026-05-10T00:00:00Z',
          reviewed_by: 'user-2',
          reviewed_at: '2026-05-11T00:00:00Z',
          rejected_reason: 'Evidence is stale.',
          evidence_id: 'ev-1',
          notes: null,
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-11T00:00:00Z',
        },
      ],
      error: null,
    });

    fromMock
      .mockReturnValueOnce(evalBuilder)
      .mockReturnValueOnce(frameworkBuilder)
      .mockReturnValueOnce(attestationBuilder);

    const rows = await listControlsNeedingAttestation('org-1');
    expect(rows[0].latestAttestation?.id).toBe('att-2');
    expect(rows[0].latestAttestation?.status).toBe('claimed');
  });

  it('returns [] when there are no matching evaluations', async () => {
    fromMock.mockReturnValueOnce(
      createBuilder({ data: [], error: null }),
    );
    const rows = await listControlsNeedingAttestation('org-empty');
    expect(rows).toEqual([]);
  });
});

describe('updateAttestationReview', () => {
  it('throws when reject decision has no reason', async () => {
    await expect(
      updateAttestationReview({
        attestationId: 'att-1',
        reviewerUserId: 'user-2',
        decision: 'reject',
      }),
    ).rejects.toThrow(/rejected_reason required/);
  });

  it('throws separation-of-duties error when reviewer claimed', async () => {
    const readBuilder = createBuilder({
      data: { id: 'att-1', claimed_by: 'user-1', status: 'claimed' },
      error: null,
    });
    fromMock.mockReturnValueOnce(readBuilder);

    await expect(
      updateAttestationReview({
        attestationId: 'att-1',
        reviewerUserId: 'user-1',
        decision: 'approve',
      }),
    ).rejects.toThrow(/separation of duties/);
  });

  it('throws when the attestation is not in claimed state', async () => {
    const readBuilder = createBuilder({
      data: { id: 'att-1', claimed_by: 'user-1', status: 'reviewed' },
      error: null,
    });
    fromMock.mockReturnValueOnce(readBuilder);

    await expect(
      updateAttestationReview({
        attestationId: 'att-1',
        reviewerUserId: 'user-2',
        decision: 'approve',
      }),
    ).rejects.toThrow(/only 'claimed'/);
  });

  it('returns the updated row when approving', async () => {
    const readBuilder = createBuilder({
      data: { id: 'att-1', claimed_by: 'user-1', status: 'claimed' },
      error: null,
    });
    const updateBuilder = createBuilder({
      data: {
        id: 'att-1',
        organization_id: 'org-1',
        framework_id: 'fw-1',
        control_key: 'A.5.6',
        status: 'reviewed',
        claimed_by: 'user-1',
        claimed_at: '2026-05-20T00:00:00Z',
        reviewed_by: 'user-2',
        reviewed_at: '2026-05-21T00:00:00Z',
        rejected_reason: null,
        evidence_id: 'ev-1',
        notes: null,
        created_at: '2026-05-20T00:00:00Z',
        updated_at: '2026-05-21T00:00:00Z',
      },
      error: null,
    });
    fromMock
      .mockReturnValueOnce(readBuilder)
      .mockReturnValueOnce(updateBuilder);

    const row = await updateAttestationReview({
      attestationId: 'att-1',
      reviewerUserId: 'user-2',
      decision: 'approve',
    });

    expect(row.status).toBe('reviewed');
    expect(row.reviewedBy).toBe('user-2');
  });
});
