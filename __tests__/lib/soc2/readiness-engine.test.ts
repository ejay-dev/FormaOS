import {
  calculateSoc2Readiness,
  getLatestAssessment,
  getAssessmentHistory,
} from '@/lib/soc2/readiness-engine';

jest.mock('server-only', () => ({}));

const mockQuery: any = {};

function resetMock() {
  mockQuery.from = jest.fn().mockReturnValue(mockQuery);
  mockQuery.select = jest.fn().mockReturnValue(mockQuery);
  mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.in = jest.fn().mockReturnValue(mockQuery);
  mockQuery.order = jest.fn().mockReturnValue(mockQuery);
  mockQuery.limit = jest.fn().mockReturnValue(mockQuery);
  mockQuery.maybeSingle = jest.fn().mockReturnValue(mockQuery);
  mockQuery.then = jest.fn((resolve: any) =>
    resolve({ data: null, error: null }),
  );
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

// Mock soc2 framework pack
jest.mock(
  '@/framework-packs/soc2.json',
  () => ({
    controls: [
      {
        control_code: 'SOC2-S1',
        title: 'Test Control',
        summary_description: 'Test',
        implementation_guidance: 'test guidance',
        default_risk_level: 'high',
        domain: 'Security',
        suggested_evidence_types: ['document'],
        suggested_task_templates: [],
      },
    ],
    domains: [{ name: 'Security', key: 'security' }],
  }),
  { virtual: true },
);

describe('getLatestAssessment', () => {
  beforeEach(resetMock);

  it('returns null when no assessment exists', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null }),
    );

    const result = await getLatestAssessment('org-1');
    expect(result).toBeNull();
  });

  it('returns parsed assessment data', async () => {
    const mockData = {
      overall_score: 85,
      domain_scores: [
        {
          domain: 'Security',
          key: 'security',
          score: 85,
          totalControls: 10,
          satisfiedControls: 8,
          partialControls: 1,
          missingControls: 1,
        },
      ],
      control_results: [
        {
          controlCode: 'SOC2-S1',
          title: 'Control 1',
          status: 'satisfied',
          score: 90,
        },
        {
          controlCode: 'SOC2-S2',
          title: 'Control 2',
          status: 'partial',
          score: 50,
        },
      ],
      assessed_at: '2025-01-15T12:00:00Z',
    };

    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: mockData, error: null }),
    );

    const result = await getLatestAssessment('org-1');

    expect(result).not.toBeNull();
    expect(result!.overallScore).toBe(85);
    expect(result!.domainScores).toHaveLength(1);
    expect(result!.controlResults).toHaveLength(2);
    expect(result!.totalControls).toBe(2);
    expect(result!.satisfiedControls).toBe(1);
    expect(result!.assessedAt).toBe('2025-01-15T12:00:00Z');
  });

  it('queries correct table with org filter', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null }),
    );

    await getLatestAssessment('org-test');

    expect(mockQuery.from).toHaveBeenCalledWith('soc2_readiness_assessments');
    expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-test');
  });
});

describe('getAssessmentHistory', () => {
  beforeEach(resetMock);

  it('returns empty array when no history', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    const result = await getAssessmentHistory('org-1');
    expect(result).toEqual([]);
  });

  it('returns date-score pairs', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({
        data: [
          { assessed_at: '2025-01-15', overall_score: 85 },
          { assessed_at: '2025-01-01', overall_score: 72 },
        ],
        error: null,
      }),
    );

    const result = await getAssessmentHistory('org-1');

    expect(result).toEqual([
      { date: '2025-01-15', score: 85 },
      { date: '2025-01-01', score: 72 },
    ]);
  });

  it('respects limit parameter', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    await getAssessmentHistory('org-1', 5);

    expect(mockQuery.limit).toHaveBeenCalledWith(5);
  });

  it('defaults to limit of 10', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    await getAssessmentHistory('org-1');

    expect(mockQuery.limit).toHaveBeenCalledWith(10);
  });
});

// ────────────────────────────────────────────────────────
// calculateSoc2Readiness — the main readiness engine
// ────────────────────────────────────────────────────────
describe('calculateSoc2Readiness', () => {
  beforeEach(resetMock);

  it('calculates readiness with no evaluations (all zeros)', async () => {
    // All queries return empty data
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    const result = await calculateSoc2Readiness('org-1');
    expect(result.overallScore).toBe(0);
    expect(result.totalControls).toBe(11); // real soc2.json pack has 11 controls
    expect(result.satisfiedControls).toBe(0);
    expect(result.controlResults).toHaveLength(11);
    expect(result.domainScores).toHaveLength(5);
  });

  it('calculates readiness with high compliance', async () => {
    let callIdx = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callIdx++;
      // 1: org_control_evaluations
      if (callIdx === 1) {
        return resolve({
          data: [
            {
              control_key: 'SOC2-S1',
              compliance_score: 95,
              status: 'compliant',
            },
          ],
          error: null,
        });
      }
      // 2: compliance_controls
      if (callIdx === 2) {
        return resolve({
          data: [{ id: 'ctrl-1', code: 'SOC2-S1' }],
          error: null,
        });
      }
      // 3: control_evidence
      if (callIdx === 3) {
        return resolve({
          data: [{ control_id: 'ctrl-1' }, { control_id: 'ctrl-1' }],
          error: null,
        });
      }
      // 4: control_tasks
      if (callIdx === 4) {
        return resolve({
          data: [{ control_id: 'ctrl-1', task_id: 't1' }],
          error: null,
        });
      }
      // 5: org_tasks
      if (callIdx === 5) {
        return resolve({
          data: [{ id: 't1', status: 'completed' }],
          error: null,
        });
      }
      // 6: insert assessment
      return resolve({ data: null, error: null });
    });

    const result = await calculateSoc2Readiness('org-1');
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.satisfiedControls).toBe(1);
    expect(result.controlResults[0].status).toBe('satisfied');
    expect(result.controlResults[0].evidenceCount).toBe(2);
  });

  it('identifies partial compliance and gaps', async () => {
    let callIdx = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callIdx++;
      if (callIdx === 1) {
        return resolve({
          data: [
            { control_key: 'SOC2-S1', compliance_score: 50, status: 'partial' },
          ],
          error: null,
        });
      }
      if (callIdx === 2) {
        return resolve({
          data: [{ id: 'ctrl-1', code: 'SOC2-S1' }],
          error: null,
        });
      }
      if (callIdx === 3) {
        return resolve({
          data: [{ control_id: 'ctrl-1' }],
          error: null,
        });
      }
      if (callIdx === 4) {
        return resolve({
          data: [{ control_id: 'ctrl-1', task_id: 't1' }],
          error: null,
        });
      }
      if (callIdx === 5) {
        return resolve({
          data: [{ id: 't1', status: 'pending' }],
          error: null,
        });
      }
      return resolve({ data: null, error: null });
    });

    const result = await calculateSoc2Readiness('org-1');
    const control = result.controlResults[0];
    expect(control.status).toBe('partial');
    expect(control.gaps).toContain(
      'Evidence exists but compliance score below threshold',
    );
    expect(
      control.gaps.some((g: string) => g.includes('tasks incomplete')),
    ).toBe(true);
  });

  it('identifies missing control status with no evidence and no tasks', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    const result = await calculateSoc2Readiness('org-1');
    const control = result.controlResults[0];
    expect(control.status).toBe('missing');
    expect(control.gaps).toContain('No evidence collected');
    expect(control.gaps).toContain('No tasks assigned');
  });

  it('saves assessment to the database', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    await calculateSoc2Readiness('org-1');
    expect(mockQuery.from).toHaveBeenCalledWith('soc2_readiness_assessments');
    expect(mockQuery.insert).toHaveBeenCalled();
  });

  it('returns assessed timestamp', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    const result = await calculateSoc2Readiness('org-1');
    expect(result.assessedAt).toBeDefined();
    // Should be a valid ISO string
    expect(new Date(result.assessedAt).toISOString()).toBe(result.assessedAt);
  });
});
