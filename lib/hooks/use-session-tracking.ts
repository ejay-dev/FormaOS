/**
 * Client-side Session Heartbeat
 *
 * Event-driven heartbeat for active session tracking
 * Call this from main app layout after authentication
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useSessionHeartbeat(enabled = true) {
  const lastSentAtRef = useRef(0);

  const sendHeartbeat = useCallback(
    async (reason: 'login' | 'focus' | 'route_change' | 'logout' = 'focus') => {
      if (!enabled) return;

      const now = Date.now();
      const minIntervalMs = 15_000;

      if (now - lastSentAtRef.current < minIntervalMs && reason !== 'logout') {
        return;
      }

      lastSentAtRef.current = now;

      try {
        await fetch('/api/session/heartbeat', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
      } catch (error) {
        // Silently fail - non-critical
        console.debug('[Heartbeat] Failed:', error);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    void sendHeartbeat('login');

    const onFocus = () => {
      void sendHeartbeat('focus');
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat('focus');
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, sendHeartbeat]);

  return { sendHeartbeat };
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
