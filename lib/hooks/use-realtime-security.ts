/**
 * Real-time Security Monitoring Hook
 *
 * Subscribes to security_alerts and security_events tables
 * Provides live updates to security dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export type SecurityEvent = {
  id: string;
  created_at: string;
  type: string;
  severity: string;
  user_id?: string;
  org_id?: string;
  ip_address?: string;
  geo_country?: string;
  request_path?: string;
  metadata?: any;
};

export type SecurityAlert = {
  id: string;
  created_at: string;
  event_id: string;
  status: string;
  notes?: string;
};

export function useRealtimeSecurity() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    // Subscribe to security_events
    const eventsChannel = supabase
      .channel('security_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload: any) => {
          console.log('[Realtime] New security event:', payload.new);
          setEvents((prev) =>
            [payload.new as SecurityEvent, ...prev].slice(0, 50),
          );
        },
      )
      .subscribe((status: any) => {
        console.log('[Realtime] Events subscription status:', status);
        setConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to security_alerts
    const alertsChannel = supabase
      .channel('security_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'security_alerts',
        },
        (payload: any) => {
          console.log('[Realtime] Security alert change:', payload);

          if (payload.eventType === 'INSERT') {
            setAlerts((prev) => [payload.new as SecurityAlert, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? (payload.new as SecurityAlert) : a,
              ),
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      eventsChannel.unsubscribe();
      alertsChannel.unsubscribe();
    };
  }, []);

  return { events, alerts, connected };
}

/**
 * Real-time Session Monitoring Hook
 *
 * Subscribes to active_sessions table
 */
export function useRealtimeSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel('active_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
        },
        (payload: any) => {
          console.log('[Realtime] Session change:', payload);

          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            setSessions((prev) => {
              const existing = prev.find((s) => s.id === payload.new.id);
              if (existing) {
                return prev.map((s) =>
                  s.id === payload.new.id ? payload.new : s,
                );
              }
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        },
      )
      .subscribe((status: any) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { sessions, connected };
}

/**
 * Real-time Activity Feed Hook
 *
 * Subscribes to user_activity table
 */
export function useRealtimeActivity() {
  const [activity, setActivity] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel('user_activity_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
        },
        (payload: any) => {
          console.log('[Realtime] New activity:', payload.new);
          setActivity((prev) => [payload.new, ...prev].slice(0, 100));
        },
      )
      .subscribe((status: any) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { activity, connected };
}
