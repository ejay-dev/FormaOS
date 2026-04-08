/**
 * Tests for lib/intelligence/gap-detector.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'not',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import { detectComplianceGaps } from '@/lib/intelligence/gap-detector';

beforeEach(() => jest.clearAllMocks());

describe('detectComplianceGaps', () => {
  function setupClient(
    evaluations: any[],
    taskLinks: any[],
    soc2Framework: any,
    controls: any[],
    mappings: any[],
  ) {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        switch (callCount) {
          case 1:
            return createBuilder({ data: evaluations, error: null }); // org_control_evaluations
          case 2:
            return createBuilder({ data: taskLinks, error: null }); // control_tasks
          case 3:
            return createBuilder({ data: soc2Framework, error: null }); // frameworks
          case 4:
            return createBuilder({ data: controls, error: null }); // framework_controls
          case 5:
            return createBuilder({ data: mappings, error: null }); // control_mappings
          default:
            return createBuilder();
        }
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    return client;
  }

  it('detects missing evidence', async () => {
    const evals = [
      {
        control_key: 'control:c1',
        status: 'partial',
        details: {
          required_evidence_count: 3,
          approved_evidence_count: 1,
          title: 'AC-1',
        },
      },
      {
        control_key: 'control:c2',
        status: 'compliant',
        details: {
          required_evidence_count: 2,
          approved_evidence_count: 2,
          title: 'AC-2',
        },
      },
    ];
    setupClient(evals, [], { id: 'fw1' }, [], []);

    const result = await detectComplianceGaps('org-1');
    expect(result.missingEvidence).toHaveLength(1);
    expect(result.missingEvidence[0].controlKey).toBe('control:c1');
  });

  it('detects weak automation coverage', async () => {
    const evals = [
      {
        control_key: 'control:c1',
        status: 'partial',
        details: { required_evidence_count: 0, approved_evidence_count: 0 },
      },
      {
        control_key: 'control:c2',
        status: 'partial',
        details: { required_evidence_count: 0, approved_evidence_count: 0 },
      },
    ];
    const tasks = [{ control_id: 'c1' }]; // only c1 has task linkage
    setupClient(evals, tasks, { id: 'fw1' }, [], []);

    const result = await detectComplianceGaps('org-1');
    expect(result.weakAutomationCoverage).toHaveLength(1);
    expect(result.weakAutomationCoverage[0].controlKey).toBe('control:c2');
  });

  it('detects unmapped controls', async () => {
    const controls = [
      { id: 'fc1', control_code: 'SOC2-S1' },
      { id: 'fc2', control_code: 'SOC2-S2' },
    ];
    const mappings = [
      { internal_control_id: 'fc1', framework_slug: 'nist-csf' },
      { internal_control_id: 'fc1', framework_slug: 'cis-controls' },
    ]; // fc2 has no mappings
    setupClient([], [], { id: 'fw1' }, controls, mappings);

    const result = await detectComplianceGaps('org-1');
    expect(result.unmappedControls.length).toBeGreaterThanOrEqual(1);
    expect(
      result.unmappedControls.some((c) => c.controlCode === 'SOC2-S2'),
    ).toBe(true);
  });

  it('handles no soc2 framework', async () => {
    setupClient([], [], null, [], []);

    const result = await detectComplianceGaps('org-1');
    expect(result.unmappedControls).toEqual([]);
  });

  it('handles evaluations with alternative details keys', async () => {
    const evals = [
      {
        control_key: 'control:c1',
        status: 'partial',
        details: {
          requiredEvidenceCount: 5,
          approvedEvidenceCount: 1,
          control_title: 'Alt Title',
        },
      },
    ];
    setupClient(evals, [], null, [], []);

    const result = await detectComplianceGaps('org-1');
    expect(result.missingEvidence).toHaveLength(1);
    expect(result.missingEvidence[0].required).toBe(5);
  });

  it('handles control_key without control: prefix', async () => {
    const evals = [
      {
        control_key: 'plainkey',
        status: 'ok',
        details: { required_evidence_count: 0, approved_evidence_count: 0 },
      },
    ];
    setupClient(evals, [], null, [], []);

    const result = await detectComplianceGaps('org-1');
    expect(result.missingEvidence).toHaveLength(0);
  });

  it('handles null evaluations', async () => {
    setupClient(null, [], null, [], []);

    const result = await detectComplianceGaps('org-1');
    expect(result.missingEvidence).toHaveLength(0);
    expect(result.weakAutomationCoverage).toHaveLength(0);
  });
});
