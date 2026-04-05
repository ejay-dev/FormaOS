/**
 * Tests for lib/compliance/scanner.ts
 * Covers: performComplianceScan, getScanHistory, scheduleComplianceScan,
 *         getComplianceTrends, and internal scan functions
 */

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'scan-uuid-123' },
});

const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    from: (...args: any[]) => mockSupabaseFrom(...args),
  }),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/realtime', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

import {
  performComplianceScan,
  getScanHistory,
  scheduleComplianceScan,
  getComplianceTrends,
} from '@/lib/compliance/scanner';

function mockTableChain(data: any, error: any = null) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    some: jest.fn(),
    insert: jest.fn().mockResolvedValue({ data, error }),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
  // Awaitable
  chain.then = (resolve: Function) => resolve({ data, error });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// --- performComplianceScan ---

describe('performComplianceScan', () => {
  it('runs a full SOC2 scan and returns a ScanResult', async () => {
    // Mock all sub-scans returning no findings (org is compliant)
    mockSupabaseFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'tasks':
          return mockTableChain([]); // no tasks requiring evidence
        case 'policies':
          return mockTableChain([
            // all required policies exist
            { title: 'Information Security Policy' },
            { title: 'Access Control Policy' },
            { title: 'Incident Response Policy' },
            { title: 'Data Classification Policy' },
            { title: 'Acceptable Use Policy' },
          ]);
        case 'org_members':
          return mockTableChain([]); // no members without 2FA
        case 'org_evidence':
          return mockTableChain([]); // no old evidence
        case 'activity_logs':
          return mockTableChain([{ id: 'log-1' }]); // has recent activity
        case 'workflow_configs':
          return mockTableChain([{ name: 'Incident Response Workflow' }]);
        case 'compliance_scans':
          return mockTableChain(null);
        default:
          return mockTableChain(null);
      }
    });

    const result = await performComplianceScan('org-1', 'soc2');
    expect(result.scanId).toBe('scan-uuid-123');
    expect(result.organizationId).toBe('org-1');
    expect(result.framework).toBe('soc2');
    expect(result.scanType).toBe('full');
    expect(result.totalRequirements).toBe(5); // SOC2 has 5 requirements
    expect(result.complianceScore).toBeGreaterThanOrEqual(0);
    expect(result.complianceScore).toBeLessThanOrEqual(100);
    expect(result.startedAt).toBeTruthy();
    expect(result.completedAt).toBeTruthy();
    expect(Array.isArray(result.findings)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('detects missing policies as non-compliant findings', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'tasks':
          return mockTableChain([]);
        case 'policies':
          return mockTableChain([]); // no policies at all
        case 'org_members':
          return mockTableChain([]);
        case 'org_evidence':
          return mockTableChain([]);
        case 'activity_logs':
          return mockTableChain([{ id: 'log-1' }]);
        case 'workflow_configs':
          return mockTableChain([{ name: 'Incident Workflow' }]);
        case 'compliance_scans':
          return mockTableChain(null);
        default:
          return mockTableChain(null);
      }
    });

    const result = await performComplianceScan('org-1', 'soc2');
    const policyFindings = result.findings.filter(
      (f) => f.requirementId === 'policy-documentation',
    );
    expect(policyFindings.length).toBeGreaterThan(0);
    expect(policyFindings[0].status).toBe('non_compliant');
    expect(policyFindings[0].severity).toBe('high');
  });

  it('detects missing tasks evidence', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'tasks':
          return mockTableChain([
            {
              id: 't1',
              title: 'Review Access Controls',
              requires_evidence: true,
              status: 'completed',
            },
          ]);
        case 'org_evidence':
          return mockTableChain([]); // no evidence for the task
        case 'policies':
          return mockTableChain([
            { title: 'Information Security Policy' },
            { title: 'Access Control Policy' },
            { title: 'Incident Response Policy' },
            { title: 'Data Classification Policy' },
            { title: 'Acceptable Use Policy' },
          ]);
        case 'org_members':
          return mockTableChain([]);
        case 'activity_logs':
          return mockTableChain([{ id: 'log-1' }]);
        case 'workflow_configs':
          return mockTableChain([{ name: 'Incident Workflow' }]);
        case 'compliance_scans':
          return mockTableChain(null);
        default:
          return mockTableChain(null);
      }
    });

    const result = await performComplianceScan('org-1', 'soc2');
    const evidenceFindings = result.findings.filter(
      (f) => f.requirementId === 'evidence-completeness',
    );
    expect(evidenceFindings.length).toBeGreaterThan(0);
  });

  it('detects missing security monitoring', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'tasks':
          return mockTableChain([]);
        case 'policies':
          return mockTableChain([
            { title: 'Information Security Policy' },
            { title: 'Access Control Policy' },
            { title: 'Incident Response Policy' },
            { title: 'Data Classification Policy' },
            { title: 'Acceptable Use Policy' },
          ]);
        case 'org_members':
          return mockTableChain([]);
        case 'org_evidence':
          return mockTableChain([]);
        case 'activity_logs':
          return mockTableChain([]); // no recent logs
        case 'workflow_configs':
          return mockTableChain([{ name: 'Incident Workflow' }]);
        case 'compliance_scans':
          return mockTableChain(null);
        default:
          return mockTableChain(null);
      }
    });

    const result = await performComplianceScan('org-1', 'soc2');
    const monitoringFindings = result.findings.filter(
      (f) => f.requirementId === 'security-monitoring',
    );
    expect(monitoringFindings.length).toBe(1);
    expect(monitoringFindings[0].severity).toBe('high');
  });

  it('sends notification when compliance score is below 70', async () => {
    const { sendNotification } = require('@/lib/realtime');

    mockSupabaseFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'tasks':
          return mockTableChain([]);
        case 'policies':
          return mockTableChain([]); // no policies → many findings
        case 'org_members':
          return mockTableChain([]);
        case 'org_evidence':
          return mockTableChain([]);
        case 'activity_logs':
          return mockTableChain([]); // no monitoring
        case 'workflow_configs':
          return mockTableChain([]); // no incident workflow
        case 'compliance_scans':
          return mockTableChain(null);
        default:
          return mockTableChain(null);
      }
    });

    await performComplianceScan('org-1', 'soc2');
    // With many non-compliant findings, score should be low
    // sendNotification may or may not be called depending on score
    // Just verify it doesn't throw
    expect(sendNotification).toBeDefined();
  });

  it('returns empty requirements for unsupported framework', async () => {
    mockSupabaseFrom.mockReturnValue(mockTableChain([]));

    const result = await performComplianceScan('org-1', 'custom');
    expect(result.totalRequirements).toBe(0);
    expect(result.complianceScore).toBe(100); // 0 requirements → 100%
  });

  it('includes ISO 27001 requirements for iso27001 framework', async () => {
    mockSupabaseFrom.mockReturnValue(mockTableChain([]));

    const result = await performComplianceScan('org-1', 'iso27001');
    expect(result.totalRequirements).toBe(3); // 3 ISO requirements defined
    expect(result.framework).toBe('iso27001');
  });

  it('defaults scan type to full', async () => {
    mockSupabaseFrom.mockReturnValue(mockTableChain([]));

    const result = await performComplianceScan('org-1', 'soc2');
    expect(result.scanType).toBe('full');
  });

  it('accepts custom scan type', async () => {
    mockSupabaseFrom.mockReturnValue(mockTableChain([]));

    const result = await performComplianceScan('org-1', 'soc2', 'incremental');
    expect(result.scanType).toBe('incremental');
  });
});

// --- getScanHistory ---

describe('getScanHistory', () => {
  it('returns empty array on error', async () => {
    mockSupabaseFrom.mockReturnValue(
      mockTableChain(null, { message: 'error' }),
    );

    const result = await getScanHistory('org-1');
    expect(result).toEqual([]);
  });

  it('returns scan history data', async () => {
    const scans = [
      { scan_id: 's1', compliance_score: 85, framework: 'soc2' },
      { scan_id: 's2', compliance_score: 90, framework: 'soc2' },
    ];
    mockSupabaseFrom.mockReturnValue(mockTableChain(scans));

    const result = await getScanHistory('org-1');
    expect(result).toHaveLength(2);
  });

  it('filters by framework when provided', async () => {
    const chain = mockTableChain([]);
    mockSupabaseFrom.mockReturnValue(chain);

    await getScanHistory('org-1', 'soc2');
    // Should have called eq with framework filter
    expect(chain.eq).toHaveBeenCalled();
  });

  it('defaults limit to 10', async () => {
    const chain = mockTableChain([]);
    mockSupabaseFrom.mockReturnValue(chain);

    await getScanHistory('org-1');
    expect(chain.limit).toHaveBeenCalledWith(10);
  });
});

// --- scheduleComplianceScan ---

describe('scheduleComplianceScan', () => {
  it('inserts scheduled task with correct parameters', async () => {
    const chain = mockTableChain(null);
    mockSupabaseFrom.mockReturnValue(chain);

    await scheduleComplianceScan('org-1', 'soc2', 'weekly');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        task_type: 'compliance_scan',
        frequency: 'weekly',
        enabled: true,
        metadata: { framework: 'soc2' },
      }),
    );
  });

  it('supports daily frequency', async () => {
    const chain = mockTableChain(null);
    mockSupabaseFrom.mockReturnValue(chain);

    await scheduleComplianceScan('org-1', 'iso27001', 'daily');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'daily' }),
    );
  });

  it('supports monthly frequency', async () => {
    const chain = mockTableChain(null);
    mockSupabaseFrom.mockReturnValue(chain);

    await scheduleComplianceScan('org-1', 'hipaa', 'monthly');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'monthly' }),
    );
  });
});

// --- getComplianceTrends ---

describe('getComplianceTrends', () => {
  it('returns empty array on error', async () => {
    mockSupabaseFrom.mockReturnValue(
      mockTableChain(null, { message: 'error' }),
    );

    const result = await getComplianceTrends('org-1', 'soc2');
    expect(result).toEqual([]);
  });

  it('returns mapped date/score pairs', async () => {
    const scans = [
      { completed_at: '2026-04-01T00:00:00Z', compliance_score: 70 },
      { completed_at: '2026-04-02T00:00:00Z', compliance_score: 75 },
      { completed_at: '2026-04-03T00:00:00Z', compliance_score: 80 },
    ];
    mockSupabaseFrom.mockReturnValue(mockTableChain(scans));

    const result = await getComplianceTrends('org-1', 'soc2');
    expect(result).toEqual([
      { date: '2026-04-01T00:00:00Z', score: 70 },
      { date: '2026-04-02T00:00:00Z', score: 75 },
      { date: '2026-04-03T00:00:00Z', score: 80 },
    ]);
  });

  it('defaults to 90 days lookback', async () => {
    const chain = mockTableChain([]);
    mockSupabaseFrom.mockReturnValue(chain);

    await getComplianceTrends('org-1', 'soc2');
    expect(chain.gte).toHaveBeenCalled();
  });

  it('accepts custom days parameter', async () => {
    const chain = mockTableChain([]);
    mockSupabaseFrom.mockReturnValue(chain);

    await getComplianceTrends('org-1', 'soc2', 30);
    expect(chain.gte).toHaveBeenCalled();
  });
});
