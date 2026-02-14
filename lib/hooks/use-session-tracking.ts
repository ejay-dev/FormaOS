/**
 * Client-side Session Heartbeat
 *
 * Automatically sends heartbeat every 60 seconds to track active sessions
 * Call this from main app layout after authentication
 */

'use client';

import { useEffect, useRef } from 'react';

export function useSessionHeartbeat(enabled = true) {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/session/heartbeat', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        // Silently fail - non-critical
        console.debug('[Heartbeat] Failed:', error);
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    // Then every 60 seconds
    intervalRef.current = setInterval(sendHeartbeat, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);
}

/**
 * Activity Tracker
 *
 * Logs high-level user actions
 */
export function useActivityTracker(enabled = true) {
  const trackActivity = async (params: {
    action: string;
    entityType?: string;
    entityId?: string;
    route?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!enabled) return;

    try {
      await fetch('/api/activity/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'include',
      });
    } catch (error) {
      console.debug('[Activity] Failed to track:', error);
    }
  };

  return { trackActivity };
}
