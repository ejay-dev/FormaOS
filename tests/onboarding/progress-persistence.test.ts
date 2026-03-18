/**
 * Unit Tests for Progress Persistence
 * Tests localStorage caching for onboarding progress
 */

import {
  getCachedProgress,
  setCachedProgress,
  clearCachedProgress,
  hasFreshCache,
} from '@/lib/onboarding/progress-persistence';
import type { ChecklistCompletionCounts } from '@/lib/onboarding/industry-checklists';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Progress Persistence - Basic Operations', () => {
  const mockOrgId = 'org_123';
  const mockCounts: ChecklistCompletionCounts = {
    tasks: 5,
    evidence: 3,
    members: 2,
    complianceChecks: 1,
    reports: 0,
    frameworks: 1,
    policies: 4,
    incidents: 0,
    registers: 0,
    workflows: 0,
    patients: 0,
    orgProfileComplete: true,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('setCachedProgress', () => {
    it('should save progress to localStorage', () => {
      setCachedProgress(mockOrgId, mockCounts);

      const stored = localStorage.getItem('formaos_onboarding_progress');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.orgId).toBe(mockOrgId);
      expect(parsed.counts).toEqual(mockCounts);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should overwrite existing cache', () => {
      setCachedProgress(mockOrgId, mockCounts);

      const updatedCounts: ChecklistCompletionCounts = {
        ...mockCounts,
        tasks: 10,
        evidence: 5,
      };

      setCachedProgress(mockOrgId, updatedCounts);

      const cached = getCachedProgress(mockOrgId);
      expect(cached?.tasks).toBe(10);
      expect(cached?.evidence).toBe(5);
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => {
        setCachedProgress(mockOrgId, mockCounts);
      }).not.toThrow();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('getCachedProgress', () => {
    it('should retrieve cached progress', () => {
      setCachedProgress(mockOrgId, mockCounts);

      const cached = getCachedProgress(mockOrgId);
      expect(cached).toEqual(mockCounts);
    });

    it('should return null when no cache exists', () => {
      const cached = getCachedProgress('nonexistent_org');
      expect(cached).toBeNull();
    });

    it('should return null when orgId does not match', () => {
      setCachedProgress('org_456', mockCounts);

      const cached = getCachedProgress(mockOrgId);
      expect(cached).toBeNull();
    });

    it('should return null when cache is stale (>5 minutes)', () => {
      const staleData = {
        counts: mockCounts,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        orgId: mockOrgId,
      };

      localStorage.setItem(
        'formaos_onboarding_progress',
        JSON.stringify(staleData),
      );

      const cached = getCachedProgress(mockOrgId);
      expect(cached).toBeNull();
    });

    it('should return data when cache is fresh (<5 minutes)', () => {
      const freshData = {
        counts: mockCounts,
        timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
        orgId: mockOrgId,
      };

      localStorage.setItem(
        'formaos_onboarding_progress',
        JSON.stringify(freshData),
      );

      const cached = getCachedProgress(mockOrgId);
      expect(cached).toEqual(mockCounts);
    });

    it('should handle corrupted cache data', () => {
      localStorage.setItem('formaos_onboarding_progress', 'invalid json');

      const cached = getCachedProgress(mockOrgId);
      expect(cached).toBeNull();
    });

    it('should handle missing properties in cache', () => {
      const incompleteData = {
        orgId: mockOrgId,
        // Missing counts and timestamp
      };

      localStorage.setItem(
        'formaos_onboarding_progress',
        JSON.stringify(incompleteData),
      );

      // Should not throw
      expect(() => {
        getCachedProgress(mockOrgId);
      }).not.toThrow();
    });
  });

  describe('clearCachedProgress', () => {
    it('should remove cached progress', () => {
      setCachedProgress(mockOrgId, mockCounts);
      expect(getCachedProgress(mockOrgId)).not.toBeNull();

      clearCachedProgress();
      expect(getCachedProgress(mockOrgId)).toBeNull();
    });

    it('should handle clearing when no cache exists', () => {
      expect(() => {
        clearCachedProgress();
      }).not.toThrow();
    });

    it('should handle storage errors gracefully', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Cannot remove');
      });

      expect(() => {
        clearCachedProgress();
      }).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('hasFreshCache', () => {
    it('should return true when fresh cache exists', () => {
      setCachedProgress(mockOrgId, mockCounts);
      expect(hasFreshCache(mockOrgId)).toBe(true);
    });

    it('should return false when no cache exists', () => {
      expect(hasFreshCache(mockOrgId)).toBe(false);
    });

    it('should return false when cache is stale', () => {
      const staleData = {
        counts: mockCounts,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        orgId: mockOrgId,
      };

      localStorage.setItem(
        'formaos_onboarding_progress',
        JSON.stringify(staleData),
      );
      expect(hasFreshCache(mockOrgId)).toBe(false);
    });

    it('should return false when orgId does not match', () => {
      setCachedProgress('other_org', mockCounts);
      expect(hasFreshCache(mockOrgId)).toBe(false);
    });
  });
});

describe('Progress Persistence - Cache Expiration', () => {
  const mockOrgId = 'org_test';
  const mockCounts: ChecklistCompletionCounts = {
    tasks: 1,
    evidence: 1,
    members: 1,
    complianceChecks: 1,
    reports: 1,
    frameworks: 1,
    policies: 1,
    incidents: 1,
    registers: 1,
    workflows: 1,
    patients: 1,
    orgProfileComplete: false,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('should expire cache after 5 minutes exactly', () => {
    const exactlyStale = {
      counts: mockCounts,
      timestamp: Date.now() - (5 * 60 * 1000 + 1), // 5 minutes + 1ms
      orgId: mockOrgId,
    };

    localStorage.setItem(
      'formaos_onboarding_progress',
      JSON.stringify(exactlyStale),
    );
    expect(getCachedProgress(mockOrgId)).toBeNull();
  });

  it('should not expire cache before 5 minutes', () => {
    const almostStale = {
      counts: mockCounts,
      timestamp: Date.now() - (5 * 60 * 1000 - 1000), // 4 minutes 59 seconds
      orgId: mockOrgId,
    };

    localStorage.setItem(
      'formaos_onboarding_progress',
      JSON.stringify(almostStale),
    );
    expect(getCachedProgress(mockOrgId)).not.toBeNull();
  });
});

describe('Progress Persistence - Multi-Org Scenarios', () => {
  const org1 = 'org_1';
  const org2 = 'org_2';
  const counts1: ChecklistCompletionCounts = {
    tasks: 5,
    evidence: 3,
    members: 2,
    complianceChecks: 1,
    reports: 0,
    frameworks: 1,
    policies: 4,
    incidents: 0,
    registers: 0,
    workflows: 0,
    patients: 0,
    orgProfileComplete: true,
  };
  const counts2: ChecklistCompletionCounts = {
    ...counts1,
    tasks: 10,
    evidence: 8,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('should isolate cache by orgId', () => {
    setCachedProgress(org1, counts1);
    setCachedProgress(org2, counts2);

    const cached1 = getCachedProgress(org1);
    const cached2 = getCachedProgress(org2);

    // Should get org2's data (last write wins in single key storage)
    expect(cached1).toBeNull(); // org1 was overwritten
    expect(cached2).toEqual(counts2);
  });

  it('should switch between orgs correctly', () => {
    setCachedProgress(org1, counts1);
    let cached = getCachedProgress(org1);
    expect(cached).toEqual(counts1);

    setCachedProgress(org2, counts2);
    cached = getCachedProgress(org2);
    expect(cached).toEqual(counts2);
  });
});
