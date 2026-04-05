import {
  calculateComplianceScore,
  saveComplianceScore,
  updateComplianceScore,
  type ComplianceScoreResult,
} from '@/lib/automation/compliance-score-engine';

// Mock Supabase admin client
const mockQuery: any = {};
mockQuery.from = jest.fn().mockReturnValue(mockQuery);
mockQuery.select = jest.fn().mockReturnValue(mockQuery);
mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
mockQuery.in = jest.fn().mockReturnValue(mockQuery);
mockQuery.order = jest.fn().mockReturnValue(mockQuery);
mockQuery.upsert = jest.fn().mockReturnValue(mockQuery);
mockQuery.then = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

describe('calculateComplianceScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up a default mock that returns empty data for all tables
    mockQuery.from = jest.fn().mockReturnValue(mockQuery);
    mockQuery.select = jest.fn().mockReturnValue(mockQuery);
    mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
    mockQuery.in = jest.fn().mockReturnValue(mockQuery);
    mockQuery.order = jest.fn().mockReturnValue(mockQuery);
    mockQuery.upsert = jest.fn().mockReturnValue(mockQuery);
    // Default: return empty arrays
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );
  });

  it('returns a valid ComplianceScoreResult with empty data', async () => {
    const result = await calculateComplianceScore('org-1');

    expect(result.organizationId).toBe('org-1');
    expect(typeof result.overallScore).toBe('number');
    expect(typeof result.controlsScore).toBe('number');
    expect(typeof result.evidenceScore).toBe('number');
    expect(typeof result.tasksScore).toBe('number');
    expect(typeof result.policiesScore).toBe('number');
    expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    expect(result.calculatedAt).toBeInstanceOf(Date);
  });

  it('returns correct details structure', async () => {
    const result = await calculateComplianceScore('org-1');
    const { details } = result;

    expect(typeof details.totalControls).toBe('number');
    expect(typeof details.compliantControls).toBe('number');
    expect(typeof details.atRiskControls).toBe('number');
    expect(typeof details.nonCompliantControls).toBe('number');
    expect(typeof details.totalEvidence).toBe('number');
    expect(typeof details.verifiedEvidence).toBe('number');
    expect(typeof details.pendingEvidence).toBe('number');
    expect(typeof details.rejectedEvidence).toBe('number');
    expect(typeof details.totalTasks).toBe('number');
    expect(typeof details.completedTasks).toBe('number');
    expect(typeof details.overdueTasks).toBe('number');
    expect(typeof details.totalPolicies).toBe('number');
    expect(typeof details.approvedPolicies).toBe('number');
    expect(typeof details.draftPolicies).toBe('number');
  });

  it('with no controls returns 100 controlsScore', async () => {
    const result = await calculateComplianceScore('org-1');
    expect(result.controlsScore).toBe(100);
  });

  it('with no evidence returns 50 evidenceScore (neutral)', async () => {
    const result = await calculateComplianceScore('org-1');
    expect(result.evidenceScore).toBe(50);
  });

  it('with no tasks returns 100 tasksScore', async () => {
    const result = await calculateComplianceScore('org-1');
    expect(result.tasksScore).toBe(100);
  });

  it('with no policies returns 50 policiesScore', async () => {
    const result = await calculateComplianceScore('org-1');
    expect(result.policiesScore).toBe(50);
  });

  it('frameworkScores defaults to empty array when no frameworks', async () => {
    const result = await calculateComplianceScore('org-1');
    expect(result.frameworkScores).toEqual([]);
  });

  it('combinedFrameworkScore falls back to overallScore when no frameworks', async () => {
    const result = await calculateComplianceScore('org-1');
    expect(result.combinedFrameworkScore).toBe(result.overallScore);
  });
});

describe('saveComplianceScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.from = jest.fn().mockReturnValue(mockQuery);
    mockQuery.upsert = jest.fn().mockReturnValue(mockQuery);
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null }),
    );
  });

  it('calls upsert with correct table', async () => {
    const score: ComplianceScoreResult = {
      organizationId: 'org-1',
      overallScore: 75,
      controlsScore: 80,
      evidenceScore: 70,
      tasksScore: 85,
      policiesScore: 60,
      riskLevel: 'medium',
      details: {
        totalControls: 10,
        compliantControls: 8,
        atRiskControls: 1,
        nonCompliantControls: 1,
        totalEvidence: 5,
        verifiedEvidence: 3,
        pendingEvidence: 1,
        rejectedEvidence: 1,
        totalTasks: 20,
        completedTasks: 15,
        overdueTasks: 2,
        totalPolicies: 4,
        approvedPolicies: 3,
        draftPolicies: 1,
      },
      calculatedAt: new Date('2025-01-01'),
    };

    await saveComplianceScore(score);

    expect(mockQuery.from).toHaveBeenCalledWith('org_control_evaluations');
    expect(mockQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        compliance_score: 75,
        total_controls: 10,
        satisfied_controls: 8,
        missing_controls: 1,
      }),
    );
  });

  it('maps risk level to status correctly for low risk', async () => {
    const score: ComplianceScoreResult = {
      organizationId: 'org-1',
      overallScore: 90,
      controlsScore: 90,
      evidenceScore: 90,
      tasksScore: 90,
      policiesScore: 90,
      riskLevel: 'low',
      details: {
        totalControls: 0,
        compliantControls: 0,
        atRiskControls: 0,
        nonCompliantControls: 0,
        totalEvidence: 0,
        verifiedEvidence: 0,
        pendingEvidence: 0,
        rejectedEvidence: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalPolicies: 0,
        approvedPolicies: 0,
        draftPolicies: 0,
      },
      calculatedAt: new Date(),
    };

    await saveComplianceScore(score);
    expect(mockQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'compliant' }),
    );
  });

  it('maps risk level to status correctly for critical risk', async () => {
    const score: ComplianceScoreResult = {
      organizationId: 'org-1',
      overallScore: 20,
      controlsScore: 20,
      evidenceScore: 20,
      tasksScore: 20,
      policiesScore: 20,
      riskLevel: 'critical',
      details: {
        totalControls: 0,
        compliantControls: 0,
        atRiskControls: 0,
        nonCompliantControls: 0,
        totalEvidence: 0,
        verifiedEvidence: 0,
        pendingEvidence: 0,
        rejectedEvidence: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalPolicies: 0,
        approvedPolicies: 0,
        draftPolicies: 0,
      },
      calculatedAt: new Date(),
    };

    await saveComplianceScore(score);
    expect(mockQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'non_compliant' }),
    );
  });
});

describe('updateComplianceScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.from = jest.fn().mockReturnValue(mockQuery);
    mockQuery.select = jest.fn().mockReturnValue(mockQuery);
    mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
    mockQuery.in = jest.fn().mockReturnValue(mockQuery);
    mockQuery.order = jest.fn().mockReturnValue(mockQuery);
    mockQuery.upsert = jest.fn().mockReturnValue(mockQuery);
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );
  });

  it('calculates and saves in one call', async () => {
    const result = await updateComplianceScore('org-1');

    expect(result.organizationId).toBe('org-1');
    expect(typeof result.overallScore).toBe('number');
    // Verify upsert was called (save step)
    expect(mockQuery.upsert).toHaveBeenCalled();
  });
});
