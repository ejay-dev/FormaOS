'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { NotificationRecord } from '@/lib/notifications/types';

type ToastItem = NotificationRecord & { timeoutId?: number };

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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
        (payload: any) => {
          const notification = payload.new as NotificationRecord;
          if (notification.org_id !== orgId) return;
          if (!['critical', 'high'].includes(notification.priority)) return;

          const timeoutId = window.setTimeout(() => {
            setToasts((current) =>
              current.filter((item) => item.id !== notification.id),
            );
          }, autoDismissMs);

          setToasts((current) =>
            [{ ...notification, timeoutId }, ...current].slice(0, 3),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      setToasts((current) => {
        current.forEach((toast) => {
          if (toast.timeoutId) {
            window.clearTimeout(toast.timeoutId);
          }
        });
        return [];
      });
    };
  }, [autoDismissMs, orgId, supabase, userId]);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="button"
          tabIndex={0}
          onClick={() => {
            const href =
              typeof toast.data?.href === 'string' ? toast.data.href : '/app';
            setToasts((current) => current.filter((item) => item.id !== toast.id));
            router.push(href);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              const href =
                typeof toast.data?.href === 'string' ? toast.data.href : '/app';
              setToasts((current) =>
                current.filter((item) => item.id !== toast.id),
              );
              router.push(href);
            }
          }}
          className="pointer-events-auto rounded-2xl border border-rose-400/30 bg-slate-950/95 p-4 text-left shadow-2xl shadow-black/30 transition hover:border-rose-300/50"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-rose-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-200">
                {toast.priority} priority
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-100">
                {toast.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">{toast.body}</p>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id),
                );
              }}
              className="pointer-events-auto rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
              aria-label="Dismiss notification toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
