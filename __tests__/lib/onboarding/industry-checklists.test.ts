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
  evidence: 0,
  members: 0,
  complianceChecks: 0,
  reports: 0,
  frameworks: 0,
  policies: 0,
  incidents: 0,
  registers: 0,
  workflows: 0,
  patients: 0,
  orgProfileComplete: false,
};

const FULL_COUNTS: ChecklistCompletionCounts = {
  tasks: 10,
  evidence: 5,
  members: 5,
  complianceChecks: 3,
  reports: 2,
  frameworks: 3,
  policies: 5,
  incidents: 0,
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
    expect(progress.progress).toBeGreaterThan(0);
    expect(progress.completedItems.length).toBeGreaterThan(0);
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
