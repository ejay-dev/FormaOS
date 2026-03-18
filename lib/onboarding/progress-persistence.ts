/**
 * =========================================================
 * ONBOARDING PROGRESS PERSISTENCE
 * =========================================================
 * Caches completion counts in localStorage for instant UI updates
 * Syncs with server data on mount and periodically
 */

import type { ChecklistCompletionCounts } from './industry-checklists';

const STORAGE_KEY = 'formaos_onboarding_progress';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

type CachedProgress = {
  counts: ChecklistCompletionCounts;
  timestamp: number;
  orgId: string;
};

/**
 * Get cached progress from localStorage
 */
export function getCachedProgress(
  orgId: string,
): ChecklistCompletionCounts | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;

    const data: CachedProgress = JSON.parse(cached);

    // Validate orgId matches
    if (data.orgId !== orgId) return null;

    // Check if cache is still fresh
    const age = Date.now() - data.timestamp;
    if (age > CACHE_DURATION_MS) return null;

    return data.counts;
  } catch (error) {
    console.warn('[progress-persistence] Failed to read cache:', error);
    return null;
  }
}

/**
 * Save progress to localStorage
 */
export function setCachedProgress(
  orgId: string,
  counts: ChecklistCompletionCounts,
): void {
  if (typeof window === 'undefined') return;

  try {
    const data: CachedProgress = {
      counts,
      timestamp: Date.now(),
      orgId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[progress-persistence] Failed to save cache:', error);
  }
}

/**
 * Clear cached progress (useful on logout)
 */
export function clearCachedProgress(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[progress-persistence] Failed to clear cache:', error);
  }
}

/**
 * Check if cached progress exists and is fresh
 */
export function hasFreshCache(orgId: string): boolean {
  const cached = getCachedProgress(orgId);
  return cached !== null;
}
