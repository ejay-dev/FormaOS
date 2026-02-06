'use client';

import { useEffect, useRef } from 'react';
import { useTrialState } from '@/lib/trial/use-trial-state';
import { useFeatureUsage } from '@/lib/trial/use-feature-usage';
import { usePathname } from 'next/navigation';

/**
 * =========================================================
 * UpgradeSuggestionEngine – Background feature action tracker
 * =========================================================
 * Silently monitors navigation and page visits to track
 * feature engagement. When thresholds are met, the UpgradeModal
 * picks up the signal and shows the upgrade prompt.
 *
 * This component has NO visual output — it's purely a tracker.
 * Mount it once in the app layout.
 *
 * Tracked signals:
 * - Page navigations to feature pages (tasks, policies, vault, etc.)
 * - High usage detection on any feature
 */

const FEATURE_ROUTE_MAP: Record<string, string> = {
  '/app/tasks': 'tasks',
  '/app/policies': 'policies',
  '/app/vault': 'vault',
  '/app/reports': 'reports',
  '/app/audit': 'audits',
  '/app/people': 'team',
  '/app/registers': 'registers',
  '/app/patients': 'patients',
  '/app/progress-notes': 'progress_notes',
};

export function UpgradeSuggestionEngine() {
  const { isTrialUser, isExpired } = useTrialState();
  const { trackAction } = useFeatureUsage();
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!isTrialUser || isExpired) return;
    if (lastTracked.current === pathname) return;

    // Match current route to a feature
    const matchedFeature = Object.entries(FEATURE_ROUTE_MAP).find(
      ([route]) => pathname === route || pathname.startsWith(route + '/'),
    );

    if (matchedFeature) {
      trackAction(matchedFeature[1]);
      lastTracked.current = pathname;
    }
  }, [pathname, isTrialUser, isExpired, trackAction]);

  return null; // No visual output
}
