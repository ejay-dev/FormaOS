import { generateBoardPack } from '@/lib/executive/board-pack-generator';

const mockQuery: any = {};

function resetMock() {
  mockQuery.from = jest.fn().mockReturnValue(mockQuery);
  mockQuery.select = jest.fn().mockReturnValue(mockQuery);
  mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.neq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.in = jest.fn().mockReturnValue(mockQuery);
  mockQuery.gte = jest.fn().mockReturnValue(mockQuery);
  mockQuery.lte = jest.fn().mockReturnValue(mockQuery);
  mockQuery.order = jest.fn().mockReturnValue(mockQuery);
  mockQuery.single = jest.fn().mockReturnValue(mockQuery);
  mockQuery.then = jest.fn((resolve: any) =>
    resolve({ data: null, error: null, count: 0 }),
  );
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

describe('generateBoardPack', () => {
  beforeEach(resetMock);

  it('returns pack with all required sections', async () => {
    let callIndex = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callIndex++;
      switch (callIndex) {
        case 1: // organizations.single
          return resolve({
            data: { name: 'Acme Corp', logo_url: null },
            error: null,
          });
        case 2: // org_controls
          return resolve({
            data: [
              {
                id: 'c1',
                status: 'satisfied',
                priority: 'high',
                framework_id: 'soc2',
              },
              {
                id: 'c2',
                status: 'not_satisfied',
                priority: 'critical',
                framework_id: 'soc2',
              },
            ],
            error: null,
          });
        case 3: // org_evidence count
          return resolve({ data: null, error: null, count: 10 });
        case 4: // org_tasks (open) count
          return resolve({ data: null, error: null, count: 5 });
        case 5: // org_controls (gaps)
          return resolve({
            data: [
              {
                id: 'c2',
                title: 'Gap Control',
                status: 'not_satisfied',
                priority: 'critical',
              },
            ],
            error: null,
          });
        case 6: // org_incidents
          return resolve({
            data: [
              {
                id: 'i1',
                status: 'resolved',
                severity: 'high',
                created_at: '2025-01-15',
              },
              {
                id: 'i2',
                status: 'open',
                severity: 'medium',
                created_at: '2025-01-20',
              },
            ],
            error: null,
          });
        case 7: // org_tasks (all)
          return resolve({
            data: [
              { id: 't1', status: 'completed', due_date: '2025-01-10' },
              { id: 't2', status: 'todo', due_date: '2024-12-01' },
            ],
            error: null,
          });
        case 8: // org_report_generations insert
          return resolve({ data: null, error: null });
        default:
          return resolve({ data: null, error: null, count: 0 });
      }
    });

    const result = await generateBoardPack('org-1', {
      dateRange: { from: '2025-01-01', to: '2025-01-31' },
    });

    expect(result.orgName).toBe('Acme Corp');
    expect(result.generatedAt).toBeDefined();
    expect(result.sections.length).toBeGreaterThanOrEqual(7);

    const types = result.sections.map((s) => s.type);
    expect(types).toContain('summary');
    expect(types).toContain('scorecard');
    expect(types).toContain('risk_register');
    expect(types).toContain('gaps');
    expect(types).toContain('audit_readiness');
    expect(types).toContain('incidents');
    expect(types).toContain('remediation');
  });

  it('includes appendix when requested', async () => {
    let callIndex = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callIndex++;
      if (callIndex === 1)
        return resolve({ data: { name: 'Test' }, error: null });
      return resolve({ data: [], error: null, count: 0 });
    });

    const result = await generateBoardPack('org-1', {
      dateRange: { from: '2025-01-01', to: '2025-01-31' },
      includeAppendix: true,
    });

    const types = result.sections.map((s) => s.type);
    expect(types).toContain('appendix');
  });

  it('calculates compliance score correctly', async () => {
    let callIndex = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callIndex++;
      switch (callIndex) {
        case 1:
          return resolve({ data: { name: 'Org' }, error: null });
        case 2:
          return resolve({
            data: [
              {
                id: 'c1',
                status: 'satisfied',
                priority: 'medium',
                framework_id: 'f1',
              },
              {
                id: 'c2',
                status: 'satisfied',
                priority: 'medium',
                framework_id: 'f1',
              },
              {
                id: 'c3',
                status: 'not_satisfied',
                priority: 'low',
                framework_id: 'f1',
              },
            ],
            error: null,
          });
        default:
          return resolve({ data: [], error: null, count: 0 });
      }
    });

    const result = await generateBoardPack('org-1', {
      dateRange: { from: '2025-01-01', to: '2025-06-01' },
    });

    const summary = result.sections.find((s) => s.type === 'summary');
    expect((summary!.data as any).complianceScore).toBe(67); // 2/3
    expect((summary!.data as any).totalControls).toBe(3);
    expect((summary!.data as any).satisfiedControls).toBe(2);
  });

  it('falls back to "Organization" when org name not found', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null, count: 0 }),
    );

    const result = await generateBoardPack('org-1', {
      dateRange: { from: '2025-01-01', to: '2025-01-31' },
    });

    expect(result.orgName).toBe('Organization');
  });
});
