'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/stores/app';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  USAGE_THRESHOLD_NUDGE,
  USAGE_THRESHOLD_WARNING,
  USAGE_THRESHOLD_HARD_LIMIT,
  LS_FEATURE_ACTION_COUNT,
  MIN_ACTIONS_FOR_UPGRADE_SUGGESTION,
} from './constants';

/**
 * =========================================================
 * Feature usage item returned by the hook
 * =========================================================
 */
export interface FeatureUsageItem {
  key: string;
  label: string;
  current: number;
  limit: number; // -1 = unlimited
  percentage: number; // 0-100, capped at 100
  status: 'ok' | 'nudge' | 'warning' | 'exceeded';
}

/**
 * =========================================================
 * useFeatureUsage – Lightweight feature usage tracker
 * =========================================================
 * Queries usage counts for the org and compares against
 * the entitlement limits from the store. No polling — fetched
 * on mount and exposes a `refresh()` for on-demand updates.
 */
export function useFeatureUsage() {
  const orgId = useAppStore((s) => s.organization?.id ?? null);
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [usage, setUsage] = useState<FeatureUsageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!orgId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Parallel count queries — lightweight, no payload
      const [members, tasks, evidence, policies] = await Promise.all([
        supabase
          .from('org_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('evidence')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('policies')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
      ]);

      // Build usage items against entitlement limits
      // Derive limits from enabled modules — use plan catalog defaults
      // These are soft limits; entitlement limit_values override if present

      const items: FeatureUsageItem[] = [
        buildUsageItem('team_members', 'Team Members', members.count ?? 0, 15),
        buildUsageItem('tasks', 'Tasks Created', tasks.count ?? 0, -1),
        buildUsageItem('evidence', 'Evidence Items', evidence.count ?? 0, -1),
        buildUsageItem('policies', 'Policies', policies.count ?? 0, -1),
      ];

      setUsage(items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load usage data',
      );
    } finally {
      setIsLoading(false);
    }
  }, [orgId, supabase]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  /**
   * High-usage detection: returns true if any feature is above the nudge threshold
   */
  const hasHighUsage = useMemo(
    () =>
      usage.some(
        (u) =>
          u.status === 'nudge' ||
          u.status === 'warning' ||
          u.status === 'exceeded',
      ),
    [usage],
  );

  /**
   * Track a feature action (persisted in localStorage for upgrade suggestion logic)
   */
  const trackAction = useCallback((featureKey: string) => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(LS_FEATURE_ACTION_COUNT) || '{}';
    try {
      const counts = JSON.parse(raw) as Record<string, number>;
      counts[featureKey] = (counts[featureKey] ?? 0) + 1;
      localStorage.setItem(LS_FEATURE_ACTION_COUNT, JSON.stringify(counts));
    } catch {
      // Ignore parse errors
    }
  }, []);

  /**
   * Get total action count across all features
   */
  const totalActions = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(LS_FEATURE_ACTION_COUNT) || '{}';
      const counts = JSON.parse(raw) as Record<string, number>;
      return Object.values(counts).reduce((sum, v) => sum + v, 0);
    } catch {
      return 0;
    }
  }, []);

  const isHighEngagement = totalActions >= MIN_ACTIONS_FOR_UPGRADE_SUGGESTION;

  return {
    usage,
    isLoading,
    error,
    hasHighUsage,
    isHighEngagement,
    totalActions,
    refresh: fetchUsage,
    trackAction,
  };
}

// =========================================================
// Internal helpers
// =========================================================

function buildUsageItem(
  key: string,
  label: string,
  current: number,
  limit: number,
): FeatureUsageItem {
  if (limit === -1) {
    return { key, label, current, limit, percentage: 0, status: 'ok' };
  }

  const percentage =
    limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  let status: FeatureUsageItem['status'] = 'ok';

  if (percentage >= USAGE_THRESHOLD_HARD_LIMIT) status = 'exceeded';
  else if (percentage >= USAGE_THRESHOLD_WARNING) status = 'warning';
  else if (percentage >= USAGE_THRESHOLD_NUDGE) status = 'nudge';

  return { key, label, current, limit, percentage, status };
}
