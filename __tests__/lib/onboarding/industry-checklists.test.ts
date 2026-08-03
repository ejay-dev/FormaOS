/**
 * Tests for lib/onboarding/industry-checklists.ts — checklist generation + progress tracking
 */

import {
  generateIndustryChecklist,
  getChecklistProgress,
  getNextAction,
  getItemsByCategory,
  getItemsByPriority,
  estimateTimeToCompletion,
  getCompletionSummary,
  getGenericChecklist,
  type ChecklistCompletionCounts,
} from '@/lib/onboarding/industry-checklists';

const EMPTY_COUNTS: ChecklistCompletionCounts = {
  tasks: 0,
  tasksCompleted: 0,
  evidence: 0,
  evidenceVerified: 0,
  members: 0,
  complianceChecks: 0,
  reports: 0,
  frameworks: 0,
  policies: 0,
  incidents: 0,
  incidentsClosed: 0,
  registers: 0,
  workflows: 0,
  patients: 0,
  orgProfileComplete: false,
};

/**
 * Every completion criterion satisfied. `incidents` used to be 0 here, which
 * left the NDIS `incident-system` item permanently pending — the reason the
 * "returns 100%" test could only assert `progress > 0`.
 */
const FULL_COUNTS: ChecklistCompletionCounts = {
  tasks: 10,
  tasksCompleted: 10,
  evidence: 5,
  evidenceVerified: 5,
  members: 5,
  complianceChecks: 3,
  reports: 2,
  frameworks: 3,
  policies: 5,
  incidents: 2,
  incidentsClosed: 1,
  registers: 2,
  workflows: 3,
  patients: 10,
  orgProfileComplete: true,
};

describe('generateIndustryChecklist', () => {
  it('generates checklist for ndis', () => {
    const checklist = generateIndustryChecklist('ndis');
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.length).toBeLessThanOrEqual(8);
  });

  it('generates checklist for healthcare', () => {
    const checklist = generateIndustryChecklist('healthcare');
    expect(checklist.length).toBeGreaterThan(0);
  });

  it('generates checklist for unknown industry (fallback)', () => {
    const checklist = generateIndustryChecklist('unknown_industry');
    expect(checklist.length).toBeGreaterThan(0);
  });

  it('checklist items have required fields', () => {
    const checklist = generateIndustryChecklist('ndis');
    for (const item of checklist) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.href).toBeTruthy();
      expect(['setup', 'compliance', 'operational', 'readiness']).toContain(
        item.category,
      );
      expect(['critical', 'high']).toContain(item.priority);
      expect(typeof item.completionCheck).toBe('function');
    }
  });

  it('generates different checklists for different industries', () => {
    const ndis = generateIndustryChecklist('ndis');
    const saas = generateIndustryChecklist('saas_technology');
    // They should have different first items (different industries)
    expect(ndis[0].id).not.toBe(saas[0].id);
  });
});

describe('getChecklistProgress', () => {
  it('returns 0% progress when nothing is complete', () => {
    const checklist = generateIndustryChecklist('ndis');
    const progress = getChecklistProgress(checklist, EMPTY_COUNTS);
    expect(progress.progress).toBe(0);
    expect(progress.completedCount).toBe(0);
    expect(progress.pendingItems.length).toBe(checklist.length);
  });

  it('returns 100% when everything is complete', () => {
    const checklist = generateIndustryChecklist('ndis');
    const progress = getChecklistProgress(checklist, FULL_COUNTS);
    expect(progress.progress).toBe(100);
    expect(progress.completedCount).toBe(checklist.length);
    expect(progress.completedItems).toEqual(checklist.map((item) => item.id));
    expect(progress.pendingItems).toEqual([]);
  });

  it('leaves the incident item pending when no incident has been logged', () => {
    const checklist = generateIndustryChecklist('ndis');
    const progress = getChecklistProgress(checklist, {
      ...FULL_COUNTS,
      incidents: 0,
    });
    // 7 of the 8 NDIS items satisfied -> round(7/8 * 100) = 88.
    expect(progress.pendingItems).toEqual(['incident-system']);
    expect(progress.progress).toBe(88);
  });

  it('scores a partially complete checklist proportionally', () => {
    const checklist = generateIndustryChecklist('ndis');
    const progress = getChecklistProgress(checklist, {
      ...EMPTY_COUNTS,
      orgProfileComplete: true, // provider-details
      members: 5, // staff-setup
      patients: 1, // participant-onboarding
      registers: 1, // location-setup + credential-register
    });
    expect(progress.completedCount).toBe(5);
    expect(progress.progress).toBe(63); // round(5/8 * 100)
  });

  it('returns correct total count', () => {
    const checklist = generateIndustryChecklist('ndis');
    const progress = getChecklistProgress(checklist, EMPTY_COUNTS);
    expect(progress.totalCount).toBe(checklist.length);
  });

  it('handles empty checklist', () => {
    const progress = getChecklistProgress([], EMPTY_COUNTS);
    expect(progress.progress).toBe(0);
    expect(progress.completedCount).toBe(0);
    expect(progress.totalCount).toBe(0);
  });
});

describe('getNextAction', () => {
  it('returns first incomplete item', () => {
    const checklist = generateIndustryChecklist('ndis');
    const next = getNextAction(checklist, EMPTY_COUNTS);
    expect(next).not.toBeNull();
    expect(next!.id).toBe(checklist[0].id);
  });

  it('returns null when all complete', () => {
    const checklist = getGenericChecklist();
    const next = getNextAction(checklist, FULL_COUNTS);
    expect(next).toBeNull();
  });
});

describe('getItemsByCategory', () => {
  it('filters by setup category', () => {
    const checklist = generateIndustryChecklist('ndis');
    const setupItems = getItemsByCategory(checklist, 'setup');
    // An empty result would make the per-item loop vacuous.
    expect(setupItems.length).toBeGreaterThan(0);
    expect(setupItems.length).toBeLessThan(checklist.length);
    for (const item of setupItems) {
      expect(item.category).toBe('setup');
    }
  });

  it('returns empty for nonexistent items', () => {
    const checklist = generateIndustryChecklist('ndis');
    const readinessItems = getItemsByCategory(checklist, 'readiness');
    // May or may not have readiness items in first 2 phases
    for (const item of readinessItems) {
      expect(item.category).toBe('readiness');
    }
  });
});

describe('getItemsByPriority', () => {
  it('filters by critical priority', () => {
    const checklist = generateIndustryChecklist('ndis');
    const criticalItems = getItemsByPriority(checklist, 'critical');
    expect(criticalItems.length).toBeGreaterThan(0);
    for (const item of criticalItems) {
      expect(item.priority).toBe('critical');
    }
  });
});

describe('estimateTimeToCompletion', () => {
  it('returns total minutes for all items when none complete', () => {
    const checklist = generateIndustryChecklist('ndis');
    const totalMinutes = estimateTimeToCompletion(checklist, EMPTY_COUNTS);
    expect(totalMinutes).toBeGreaterThan(0);
  });

  it('returns 0 when all items complete', () => {
    const checklist = getGenericChecklist();
    const minutes = estimateTimeToCompletion(checklist, FULL_COUNTS);
    expect(minutes).toBe(0);
  });
});

describe('getCompletionSummary', () => {
  it('returns byCategory and byPriority breakdowns', () => {
    const checklist = generateIndustryChecklist('ndis');
    const summary = getCompletionSummary(checklist, EMPTY_COUNTS);
    expect(summary).toHaveProperty('byCategory');
    expect(summary).toHaveProperty('byPriority');
    expect(summary).toHaveProperty('overallProgress');
    expect(summary.byCategory).toHaveProperty('setup');
    expect(summary.byCategory).toHaveProperty('compliance');
    expect(summary.byPriority).toHaveProperty('critical');
    expect(summary.byPriority).toHaveProperty('high');
  });

  it('overallProgress is 0 when nothing complete', () => {
    const checklist = generateIndustryChecklist('ndis');
    const summary = getCompletionSummary(checklist, EMPTY_COUNTS);
    expect(summary.overallProgress).toBe(0);
  });
});

describe('getGenericChecklist', () => {
  it('returns non-empty checklist', () => {
    const checklist = getGenericChecklist();
    expect(checklist.length).toBeGreaterThan(0);
  });

  it('items have completionCheck functions', () => {
    const checklist = getGenericChecklist();
    for (const item of checklist) {
      expect(typeof item.completionCheck).toBe('function');
    }
  });

  it('completionCheck returns false for empty counts', () => {
    const checklist = getGenericChecklist();
    for (const item of checklist) {
      expect(item.completionCheck(EMPTY_COUNTS)).toBe(false);
    }
  });

  it('completionCheck returns true for full counts', () => {
    const checklist = getGenericChecklist();
    for (const item of checklist) {
      expect(item.completionCheck(FULL_COUNTS)).toBe(true);
    }
  });
});
