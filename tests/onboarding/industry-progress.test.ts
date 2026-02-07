import { getRoadmapForIndustry } from '@/lib/onboarding/industry-roadmaps';
import { getCompletedRoadmapSteps } from '@/lib/onboarding/industry-checklists';
import type { ChecklistCompletionCounts } from '@/lib/onboarding/industry-checklists';

describe('industry roadmap progress', () => {
  it('marks expected steps complete based on counts', () => {
    const roadmap = getRoadmapForIndustry('ndis');
    const counts: ChecklistCompletionCounts = {
      tasks: 3,
      evidence: 1,
      members: 2,
      complianceChecks: 1,
      reports: 1,
      frameworks: 1,
      policies: 3,
      incidents: 1,
      registers: 1,
      workflows: 1,
      patients: 1,
      orgProfileComplete: true,
    };

    const completed = getCompletedRoadmapSteps(roadmap, counts);

    expect(completed).toEqual(
      expect.arrayContaining([
        'provider-details',
        'staff-setup',
        'participant-onboarding',
        'framework-provision',
        'policy-library',
        'evidence-capture',
      ]),
    );
  });
});
