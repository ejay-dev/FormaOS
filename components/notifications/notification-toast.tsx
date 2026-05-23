'use client';

// Audit Sprint 7b (2026-05-24): replaces the previous hand-rolled
// portal + auto-dismiss timer + 3-toast queue with sonner. The Realtime
// subscription (the *real* job of this component) stays — only the
// rendering side moves to the shared Toaster mounted at the root.
// Component now returns null; mount in app/app/layout.tsx is unchanged.

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toaster';
import type { NotificationRecord } from '@/lib/notifications/types';

export function NotificationToast({
  userId,
  orgId,
  autoDismissMs = 5000,
}: {
  userId: string;
  orgId: string;
  autoDismissMs?: number;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`notification-toasts:${userId}:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const notification = payload.new as unknown as NotificationRecord;
          if (notification.org_id !== orgId) return;
          if (!['critical', 'high'].includes(notification.priority)) return;

          const href =
            typeof notification.data?.href === 'string'
              ? notification.data.href
              : '/app';

          const variant =
            notification.priority === 'critical' ? toast.error : toast.warning;

          variant(notification.title, {
            description: notification.body,
            duration: autoDismissMs,
            action: {
              label: 'View',
              onClick: () => router.push(href),
            },
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [autoDismissMs, orgId, supabase, userId, router]);

  // Rendering moved to the shared Toaster (components/ui/toaster.tsx,
  // mounted in app/app/layout.tsx). This component is now side-effect-
  // only; existing call sites don't change.
  return null;
}
