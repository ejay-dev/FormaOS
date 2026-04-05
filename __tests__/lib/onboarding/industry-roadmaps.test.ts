/**
 * Tests for lib/onboarding/industry-roadmaps.ts — data structure + helper functions
 * This file is 1787 LOC; testing it provides significant coverage gain.
 */

import {
  INDUSTRY_ROADMAPS,
  getRoadmapForIndustry,
  getAllIndustries,
  getTotalSteps,
  getTotalEstimatedDays,
  getStepsByCategory,
  getStepsByPriority,
  type IndustryRoadmap,
} from '@/lib/onboarding/industry-roadmaps';

const ALL_INDUSTRY_IDS = [
  'ndis',
  'healthcare',
  'aged_care',
  'childcare',
  'community_services',
  'financial_services',
  'saas_technology',
  'enterprise',
  'other',
];

describe('INDUSTRY_ROADMAPS', () => {
  it('defines all expected industries', () => {
    for (const id of ALL_INDUSTRY_IDS) {
      expect(INDUSTRY_ROADMAPS).toHaveProperty(id);
    }
  });

  it('each roadmap has required fields', () => {
    for (const [id, roadmap] of Object.entries(INDUSTRY_ROADMAPS)) {
      expect(roadmap.industryId).toBeTruthy();
      expect(roadmap.industryName).toBeTruthy();
      expect(roadmap.icon).toBeTruthy();
      expect(roadmap.tagline).toBeTruthy();
      expect(roadmap.estimatedTimeToOperational).toBeTruthy();
      expect(roadmap.keyFrameworks.length).toBeGreaterThan(0);
      expect(roadmap.phases.length).toBeGreaterThan(0);
    }
  });

  it('each phase has steps', () => {
    for (const roadmap of Object.values(INDUSTRY_ROADMAPS)) {
      for (const phase of roadmap.phases) {
        expect(phase.id).toBeTruthy();
        expect(phase.title).toBeTruthy();
        expect(phase.steps.length).toBeGreaterThan(0);
        expect(phase.estimatedDays).toBeGreaterThan(0);
      }
    }
  });

  it('each step has valid fields', () => {
    for (const roadmap of Object.values(INDUSTRY_ROADMAPS)) {
      for (const phase of roadmap.phases) {
        for (const step of phase.steps) {
          expect(step.id).toBeTruthy();
          expect(step.title).toBeTruthy();
          expect(step.cta).toBeTruthy();
          expect(step.ctaHref).toBeTruthy();
          expect(['critical', 'high', 'medium', 'low']).toContain(
            step.priority,
          );
          expect(['setup', 'compliance', 'operational', 'readiness']).toContain(
            step.category,
          );
          expect(step.estimatedMinutes).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('step IDs are unique within each roadmap', () => {
    for (const roadmap of Object.values(INDUSTRY_ROADMAPS)) {
      const ids = roadmap.phases.flatMap((p) => p.steps.map((s) => s.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('getRoadmapForIndustry', () => {
  it('returns correct roadmap for known industry', () => {
    const ndis = getRoadmapForIndustry('ndis');
    expect(ndis.industryId).toBe('ndis');
  });

  it('returns default roadmap for unknown industry', () => {
    const unknown = getRoadmapForIndustry('unknown_industry');
    expect(unknown.industryId).toBe('other');
  });

  it('returns default roadmap for empty string', () => {
    const roadmap = getRoadmapForIndustry('');
    expect(roadmap.industryId).toBe('other');
  });
});

describe('getAllIndustries', () => {
  it('returns all roadmaps', () => {
    const all = getAllIndustries();
    expect(all.length).toBe(ALL_INDUSTRY_IDS.length);
  });

  it('contains NDIS and healthcare', () => {
    const all = getAllIndustries();
    const ids = all.map((r) => r.industryId);
    expect(ids).toContain('ndis');
    expect(ids).toContain('healthcare');
  });
});

describe('getTotalSteps', () => {
  it('returns positive number for each roadmap', () => {
    for (const roadmap of Object.values(INDUSTRY_ROADMAPS)) {
      expect(getTotalSteps(roadmap)).toBeGreaterThan(0);
    }
  });

  it('matches manual counting', () => {
    const ndis = INDUSTRY_ROADMAPS.ndis;
    const manual = ndis.phases.reduce((sum, p) => sum + p.steps.length, 0);
    expect(getTotalSteps(ndis)).toBe(manual);
  });
});

describe('getTotalEstimatedDays', () => {
  it('returns positive number for each roadmap', () => {
    for (const roadmap of Object.values(INDUSTRY_ROADMAPS)) {
      expect(getTotalEstimatedDays(roadmap)).toBeGreaterThan(0);
    }
  });
});

describe('getStepsByCategory', () => {
  it('returns only setup steps', () => {
    const ndis = INDUSTRY_ROADMAPS.ndis;
    const setupSteps = getStepsByCategory(ndis, 'setup');
    expect(setupSteps.length).toBeGreaterThan(0);
    for (const step of setupSteps) {
      expect(step.category).toBe('setup');
    }
  });

  it('returns only compliance steps', () => {
    const ndis = INDUSTRY_ROADMAPS.ndis;
    const complianceSteps = getStepsByCategory(ndis, 'compliance');
    for (const step of complianceSteps) {
      expect(step.category).toBe('compliance');
    }
  });

  it('returns empty for nonexistent category roadmaps', () => {
    const roadmap: IndustryRoadmap = {
      industryId: 'test',
      industryName: 'Test',
      icon: 'X',
      tagline: 'test',
      keyFrameworks: ['test'],
      estimatedTimeToOperational: '1 day',
      phases: [
        {
          id: 'p1',
          title: 'Phase 1',
          description: 'Test',
          estimatedDays: 1,
          steps: [
            {
              id: 's1',
              title: 'Step',
              description: 'test',
              cta: 'Go',
              ctaHref: '/go',
              icon: 'X',
              priority: 'high',
              category: 'setup',
              estimatedMinutes: 5,
            },
          ],
        },
      ],
    };
    expect(getStepsByCategory(roadmap, 'readiness')).toHaveLength(0);
  });
});

describe('getStepsByPriority', () => {
  it('returns only critical steps', () => {
    const ndis = INDUSTRY_ROADMAPS.ndis;
    const criticalSteps = getStepsByPriority(ndis, 'critical');
    expect(criticalSteps.length).toBeGreaterThan(0);
    for (const step of criticalSteps) {
      expect(step.priority).toBe('critical');
    }
  });

  it('returns only low-priority steps', () => {
    for (const roadmap of Object.values(INDUSTRY_ROADMAPS)) {
      const lowSteps = getStepsByPriority(roadmap, 'low');
      for (const step of lowSteps) {
        expect(step.priority).toBe('low');
      }
    }
  });
});
