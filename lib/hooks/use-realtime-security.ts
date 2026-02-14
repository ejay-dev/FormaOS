'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

type RealtimeCallback = () => void;

function createChannelName(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useRealtimeSecurity(onChange?: RealtimeCallback) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel(createChannelName('security_live'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_events',
        },
        () => onChange?.(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_alerts',
        },
        () => onChange?.(),
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [onChange]);

  return { connected };
}

export function useRealtimeSessions(onChange?: RealtimeCallback) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel(createChannelName('active_sessions'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
        },
        () => onChange?.(),
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [onChange]);

  return { connected };
}

export function useRealtimeActivity(onChange?: RealtimeCallback) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel(createChannelName('user_activity'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
        },
        () => onChange?.(),
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [onChange]);

  return { connected };
}
