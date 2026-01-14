/**
 * =========================================================
 * Real-Time Collaboration Infrastructure
 * =========================================================
 * Supabase Realtime integration for live updates
 */

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeEvent<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  new?: T;
  old?: T;
  timestamp: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface PresenceState {
  user_id: string;
  user_email: string;
  page: string;
  online_at: string;
}

/**
 * Hook to subscribe to real-time table updates
 */
export function useRealtimeTable<T>(
  table: string,
  filter?: { column: string; value: any },
  onEvent?: (event: RealtimeEvent<T>) => void,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetchData = async () => {
      let query = supabase.from(table).select('*');

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      const { data: initialData, error } = await query;

      if (!error && initialData) {
        setData(initialData);
      }
      setLoading(false);
    };

    fetchData();

    // Subscribe to changes
    const channelName = filter
      ? `${table}:${filter.column}=eq.${filter.value}`
      : table;

    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
        },
        (payload) => {
          const event: RealtimeEvent<T> = {
            type: payload.eventType as any,
            table: payload.table,
            new: payload.new as T,
            old: payload.old as T,
            timestamp: new Date().toISOString(),
          };

          // Update local state
          if (payload.eventType === 'INSERT' && payload.new) {
            setData((prev) => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === (payload.new as any).id ? (payload.new as T) : item,
              ),
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setData((prev) =>
              prev.filter((item: any) => item.id !== (payload.old as any).id),
            );
          }

          // Call user callback
          if (onEvent) {
            onEvent(event);
          }
        },
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [table, filter?.column, filter?.value]);

  return { data, loading, channel };
}

/**
 * Hook for real-time presence tracking (who's online)
 */
export function usePresence(
  room: string,
  userInfo: { id: string; email: string },
) {
  const [presenceState, setPresenceState] = useState<
    Record<string, PresenceState>
  >({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const presenceChannel = supabase.channel(`presence:${room}`, {
      config: {
        presence: {
          key: userInfo.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setPresenceState(state as any);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userInfo.id,
            user_email: userInfo.email,
            page: room,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [room, userInfo.id, userInfo.email]);

  const onlineUsers = Object.values(presenceState).flat();

  return { onlineUsers, channel };
}

/**
 * Hook for real-time activity feed
 */
export function useActivityFeed(orgId: string) {
  const { data: activities, loading } = useRealtimeTable<ActivityEvent>(
    'activity_logs',
    { column: 'org_id', value: orgId },
  );

  return { activities, loading };
}

/**
 * Hook for real-time notifications
 */
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data, loading } = useRealtimeTable(
    'notifications',
    { column: 'user_id', value: userId },
    (event) => {
      if (event.type === 'INSERT' && event.new) {
        // Show toast notification
        console.log('New notification:', event.new);
        setUnreadCount((prev) => prev + 1);
      }
    },
  );

  useEffect(() => {
    setNotifications(data);
    setUnreadCount(data.filter((n: any) => !n.read).length);
  }, [data]);

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

/**
 * Broadcast message to all users in a room
 */
export async function broadcastToRoom(
  room: string,
  event: string,
  payload: any,
) {
  const supabase = createClient();
  const channel = supabase.channel(room);

  await channel.send({
    type: 'broadcast',
    event,
    payload,
  });

  return channel;
}

/**
 * Create activity log entry
 */
export async function logActivity(
  orgId: string,
  userId: string,
  userEmail: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>,
) {
  const supabase = createClient();

  const { error } = await supabase.from('activity_logs').insert({
    org_id: orgId,
    user_id: userId,
    user_email: userEmail,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Send notification to user
 */
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  actionUrl?: string,
) {
  const supabase = createClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    action_url: actionUrl,
    read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to send notification:', error);
  }
}
