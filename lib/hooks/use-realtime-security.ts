'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

type RealtimeCallback = () => void;
type RealtimeOptions = {
  minIntervalMs?: number;
};

function createChannelName(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useRealtimeSecurity(
  onChange?: RealtimeCallback,
  options: RealtimeOptions = {},
) {
  const [connected, setConnected] = useState(false);
  const minIntervalMs = options.minIntervalMs ?? 5000;

  useEffect(() => {
    const supabase = createSupabaseClient();
    let lastTriggered = 0;
    let queuedTimeout: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (!onChange) return;
      const now = Date.now();
      const remaining = minIntervalMs - (now - lastTriggered);
      if (remaining <= 0) {
        lastTriggered = now;
        onChange();
        return;
      }
      if (!queuedTimeout) {
        queuedTimeout = setTimeout(() => {
          queuedTimeout = null;
          lastTriggered = Date.now();
          onChange();
        }, remaining);
      }
    };

    const channel = supabase
      .channel(createChannelName('security_live'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_events',
        },
        trigger,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_alerts',
        },
        trigger,
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (queuedTimeout) clearTimeout(queuedTimeout);
      void channel.unsubscribe();
    };
  }, [onChange, minIntervalMs]);

  return { connected };
}

export function useRealtimeSessions(
  onChange?: RealtimeCallback,
  options: RealtimeOptions = {},
) {
  const [connected, setConnected] = useState(false);
  const minIntervalMs = options.minIntervalMs ?? 3000;

  useEffect(() => {
    const supabase = createSupabaseClient();
    let lastTriggered = 0;
    let queuedTimeout: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (!onChange) return;
      const now = Date.now();
      const remaining = minIntervalMs - (now - lastTriggered);
      if (remaining <= 0) {
        lastTriggered = now;
        onChange();
        return;
      }
      if (!queuedTimeout) {
        queuedTimeout = setTimeout(() => {
          queuedTimeout = null;
          lastTriggered = Date.now();
          onChange();
        }, remaining);
      }
    };

    const channel = supabase
      .channel(createChannelName('active_sessions'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
        },
        trigger,
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (queuedTimeout) clearTimeout(queuedTimeout);
      void channel.unsubscribe();
    };
  }, [onChange, minIntervalMs]);

  return { connected };
}

export function useRealtimeActivity(
  onChange?: RealtimeCallback,
  options: RealtimeOptions = {},
) {
  const [connected, setConnected] = useState(false);
  const minIntervalMs = options.minIntervalMs ?? 3000;

  useEffect(() => {
    const supabase = createSupabaseClient();
    let lastTriggered = 0;
    let queuedTimeout: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (!onChange) return;
      const now = Date.now();
      const remaining = minIntervalMs - (now - lastTriggered);
      if (remaining <= 0) {
        lastTriggered = now;
        onChange();
        return;
      }
      if (!queuedTimeout) {
        queuedTimeout = setTimeout(() => {
          queuedTimeout = null;
          lastTriggered = Date.now();
          onChange();
        }, remaining);
      }
    };

    const channel = supabase
      .channel(createChannelName('user_activity'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
        },
        trigger,
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (queuedTimeout) clearTimeout(queuedTimeout);
      void channel.unsubscribe();
    };
  }, [onChange, minIntervalMs]);

  return { connected };
}
