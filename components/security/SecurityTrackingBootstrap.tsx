'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  useActivityTracker,
  useSessionHeartbeat,
} from '@/lib/hooks/use-session-tracking';

const isExplicitlyDisabled = (value: string | undefined): boolean =>
  value === '0' || value?.toLowerCase() === 'false';

function isClientTrackingEnabled(): boolean {
  return !isExplicitlyDisabled(
    process.env.NEXT_PUBLIC_SECURITY_ACTIVITY_TRACKING,
  );
}

export function SecurityTrackingBootstrap() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);
  const enabled = isClientTrackingEnabled();

  const { sendHeartbeat } = useSessionHeartbeat(enabled);
  const { trackActivity } = useActivityTracker(enabled);

  useEffect(() => {
    if (!enabled) return;
    if (!pathname) return;
    if (lastTrackedPathRef.current === pathname) return;

    lastTrackedPathRef.current = pathname;
    void sendHeartbeat('route_change');
    void trackActivity({
      action: 'page_view',
      route: pathname,
      metadata: {
        source: 'security_tracking_bootstrap',
      },
    });
  }, [enabled, pathname, sendHeartbeat, trackActivity]);

  return null;
}
