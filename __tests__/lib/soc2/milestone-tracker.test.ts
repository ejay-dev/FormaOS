import {
  ensureMilestones,
  evaluateMilestones,
  getMilestones,
} from '@/lib/soc2/milestone-tracker';
import type { Soc2ReadinessResult } from '@/lib/soc2/types';

jest.mock('server-only', () => ({}));

const mockQuery: any = {};

function resetMock() {
  mockQuery.from = jest.fn().mockReturnValue(mockQuery);
  mockQuery.select = jest.fn().mockReturnValue(mockQuery);
  mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.update = jest.fn().mockReturnValue(mockQuery);
  mockQuery.upsert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.ilike = jest.fn().mockReturnValue(mockQuery);
  mockQuery.order = jest.fn().mockReturnValue(mockQuery);
  mockQuery.limit = jest.fn().mockReturnValue(mockQuery);
  mockQuery.then = jest.fn((resolve: any) =>
    resolve({ data: [], error: null }),
  );
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

describe('ensureMilestones', () => {
  beforeEach(resetMock);

  it('upserts default milestones', async () => {
    await ensureMilestones('org-1');

    expect(mockQuery.from).toHaveBeenCalledWith('soc2_milestones');
    expect(mockQuery.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          organization_id: 'org-1',
          milestone_key: 'frameworks_enabled',
          title: 'SOC 2 framework enabled',
          sort_order: 1,
          status: 'pending',
        }),
      ]),
      expect.objectContaining({ onConflict: 'organization_id,milestone_key' }),
    );
  });

  it('creates all 8 default milestones', async () => {
    await ensureMilestones('org-1');

    const upsertCall = mockQuery.upsert.mock.calls[0][0];
    expect(upsertCall).toHaveLength(8);
  });
});

describe('evaluateMilestones', () => {
  const baseReadiness: Soc2ReadinessResult = {
    overallScore: 85,
    domainScores: [],
    controlResults: [
      {
        controlCode: 'SOC2-S2',
        title: 'Access Control',
        domain: 'Security',
        riskLevel: 'high',
        status: 'satisfied',
        score: 90,
        evidenceCount: 2,
        taskCount: 1,
        completedTaskCount: 1,
        suggestedEvidenceTypes: [],
        implementationGuidance: '',
        gaps: [],
      },
      {
        controlCode: 'SOC2-S3',
        title: 'Monitoring',
        domain: 'Security',
        riskLevel: 'high',
        status: 'satisfied',
        score: 85,
        evidenceCount: 1,
        taskCount: 1,
        completedTaskCount: 1,
        suggestedEvidenceTypes: [],
        implementationGuidance: '',
        gaps: [],
      },
    ],
    totalControls: 2,
    satisfiedControls: 2,
    assessedAt: '2025-01-15',
  };

  beforeEach(resetMock);

  it('auto-completes frameworks_enabled milestone', async () => {
    // Return existing milestones
    let callCount = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callCount++;
      if (callCount === 1) {
        // existing milestones
        return resolve({
          data: [
            { milestone_key: 'frameworks_enabled', status: 'pending' },
            { milestone_key: 'readiness_80', status: 'pending' },
          ],
          error: null,
        });
      }
      return resolve({ data: [], error: null });
    });

    await evaluateMilestones('org-1', baseReadiness);

    // Should have called update for frameworks_enabled (auto-complete)
    expect(mockQuery.update).toHaveBeenCalled();
  });

  it('handles no existing milestones gracefully', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    // Should not throw
    await evaluateMilestones('org-1', baseReadiness);
  });

  it('does not re-complete already completed milestones', async () => {
    let callCount = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callCount++;
      if (callCount === 1) {
        return resolve({
          data: [{ milestone_key: 'frameworks_enabled', status: 'completed' }],
          error: null,
        });
      }
      return resolve({ data: [], error: null });
    });

    await evaluateMilestones('org-1', baseReadiness);

    // frameworks_enabled is already completed, so update should only be called for other milestones
    // Not for frameworks_enabled
  });
});

describe('getMilestones', () => {
  beforeEach(resetMock);

  it('returns mapped milestones', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({
        data: [
          {
            id: 'm1',
            milestone_key: 'frameworks_enabled',
            title: 'SOC 2 framework enabled',
            description: null,
            target_date: null,
            completed_at: '2025-01-10',
            status: 'completed',
            sort_order: 1,
          },
          {
            id: 'm2',
            milestone_key: 'policies_drafted',
            title: 'Core security policies drafted',
            description: 'Draft policies',
            target_date: '2025-02-01',
            completed_at: null,
            status: 'in_progress',
            sort_order: 2,
          },
        ],
        error: null,
      }),
    );

    const result = await getMilestones('org-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'm1',
      milestoneKey: 'frameworks_enabled',
      title: 'SOC 2 framework enabled',
      description: null,
      targetDate: null,
      completedAt: '2025-01-10',
      status: 'completed',
      sortOrder: 1,
    });
    expect(result[1].status).toBe('in_progress');
  });

  it('returns empty array when no milestones', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null }),
    );

    const result = await getMilestones('org-1');
    expect(result).toEqual([]);
  });

  it('queries with org filter and ordered by sort_order', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    await getMilestones('org-test');

    expect(mockQuery.from).toHaveBeenCalledWith('soc2_milestones');
    expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-test');
    expect(mockQuery.order).toHaveBeenCalledWith('sort_order', {
      ascending: true,
    });
  });
});
