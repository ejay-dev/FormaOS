import { INDUSTRY_ROADMAPS, getRoadmapForIndustry } from '@/lib/onboarding/industry-roadmaps';

describe('industry roadmaps', () => {
  it('resolves a roadmap for every registered industry', () => {
    for (const [industryId, roadmap] of Object.entries(INDUSTRY_ROADMAPS)) {
      const resolved = getRoadmapForIndustry(industryId);
      expect(resolved.industryId).toBe(roadmap.industryId);
      expect(resolved.phases.length).toBeGreaterThan(0);
      expect(resolved.phases.some((phase) => phase.steps.length > 0)).toBe(true);
    }
  });
});
