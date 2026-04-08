'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Filter, Inbox, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  EVENT_CATEGORY_MAP,
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationCategory,
  type NotificationRecord,
} from '@/lib/notifications/types';
import { NotificationItem } from './notification-item';

const CATEGORY_OPTIONS: Array<'all' | NotificationCategory> = [
  'all',
  'tasks',
  'compliance',
  'team',
  'workflow',
  'incident',
  'system',
  'reports',
];

function groupLabel(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && now.getDate() === date.getDate()) return 'Today';
  if (diff < oneDay * 2) return 'Yesterday';
  if (diff < oneDay * 7) return 'This Week';
  return 'Earlier';
}

type NotificationResponse = {
  items: NotificationRecord[];
  nextCursor: string | null;
};

export function NotificationCenter({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [filter, setFilter] = useState<'all' | NotificationCategory>('all');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    const response = await fetch(
      `/api/notifications/unread-count?orgId=${encodeURIComponent(orgId)}`,
      { cache: 'no-store' },
    );

    if (!response.ok) return;
    const payload = (await response.json()) as { unreadCount: number };
    setUnreadCount(payload.unreadCount);
  }, [orgId]);

  const fetchNotifications = useCallback(
    async (cursor?: string | null, reset?: boolean) => {
      const params = new URLSearchParams({ orgId, limit: '20' });
      if (filter !== 'all') params.set('category', filter);
      if (cursor) params.set('cursor', cursor);

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetch(
          `/api/notifications?${params.toString()}`,
          {
            cache: 'no-store',
          },
        );
        if (!response.ok) return;

        const payload = (await response.json()) as NotificationResponse;
        setItems((previous) =>
          reset ? payload.items : [...previous, ...payload.items],
        );
        setNextCursor(payload.nextCursor);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, orgId],
  );

  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void fetchNotifications(null, true);
  }, [fetchNotifications, open]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: {
          eventType: string;
          new: Record<string, unknown>;
          old: Record<string, unknown>;
        }) => {
          const next = payload.new as unknown as NotificationRecord | undefined;
          const previous = payload.old as unknown as
            | NotificationRecord
            | undefined;

          if (next?.org_id && next.org_id !== orgId) {
            return;
          }

          setItems((current) => {
            if (payload.eventType === 'INSERT' && next) {
              return [next, ...current.filter((item) => item.id !== next.id)];
            }

            if (payload.eventType === 'UPDATE' && next) {
              return current.map((item) => (item.id === next.id ? next : item));
            }

            if (payload.eventType === 'DELETE' && previous) {
              return current.filter((item) => item.id !== previous.id);
            }

            return current;
          });

          void fetchUnreadCount();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchUnreadCount, orgId, supabase, userId]);

  useEffect(() => {
    if (!open || !nextCursor || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingMore) {
          void fetchNotifications(nextCursor, false);
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNotifications, loadingMore, nextCursor, open]);

  const groupedItems = useMemo(() => {
    const visible = items.filter((item) =>
      filter === 'all' ? true : EVENT_CATEGORY_MAP[item.type] === filter,
    );

    return visible.reduce<Record<string, NotificationRecord[]>>(
      (groups, item) => {
        const key = groupLabel(item.created_at);
        groups[key] = [...(groups[key] ?? []), item];
        return groups;
      },
      {},
    );
  }, [filter, items]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, ids: [id], action: 'mark_read' }),
      });
    },
    [orgId],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (target && !target.read_at) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, ids: [id], action: 'archive' }),
      });
    },
    [items, orgId],
  );

  const handleMarkAllRead = useCallback(async () => {
    setItems((current) =>
      current.map((item) =>
        item.read_at ? item : { ...item, read_at: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);

    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, action: 'mark_all_read' }),
    });
  }, [orgId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="relative rounded-full p-2 md:p-2.5 text-sidebar-foreground/90 hover:bg-card/8 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
              {unreadCount > 9 ? '10+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[96vw] max-w-[440px] bg-slate-950/95"
      >
        <SheetHeader className="border-b border-glass-border pb-4 pr-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg font-black tracking-tight">
                Notification Center
              </SheetTitle>
              <SheetDescription>
                Real-time alerts, approvals, and delivery history.
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className="border-glass-border bg-glass-strong text-foreground/90"
            >
              {unreadCount} unread
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  filter === option
                    ? 'border-sky-400/30 bg-sky-500/15 text-sky-100'
                    : 'border-glass-border bg-glass-subtle/50 text-muted-foreground hover:text-foreground/90'
                }`}
              >
                {option === 'all'
                  ? 'All'
                  : NOTIFICATION_CATEGORY_LABELS[option]}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={handleMarkAllRead}
              className="rounded-full border border-glass-border bg-glass-subtle/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground/90"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push('/app/settings/notifications')}
              className="rounded-full border border-glass-border bg-glass-subtle/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground/90"
            >
              <Filter className="mr-2 h-4 w-4" />
              Preferences
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-glass-border bg-glass-subtle/50 px-6 py-14 text-center">
              <Inbox className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-4 text-sm font-semibold text-foreground/90">
                No notifications yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground/60">
                New activity, review requests, and system alerts will appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([group, groupItems]) => (
                <section key={group}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-glass-strong" />
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground/60">
                      {group}
                    </span>
                    <div className="h-px flex-1 bg-glass-strong" />
                  </div>

                  <div className="space-y-3">
                    {groupItems.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={handleMarkRead}
                        onArchive={handleArchive}
                        onView={(item) => {
                          if (!item.read_at) {
                            void handleMarkRead(item.id);
                          }

                          const href =
                            typeof item.data?.href === 'string'
                              ? item.data.href
                              : '/app';
                          setOpen(false);
                          router.push(href);
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))}

              <div
                ref={sentinelRef}
                className="flex items-center justify-center py-4"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />
                ) : nextCursor ? (
                  <span className="text-xs text-muted-foreground/60">
                    Loading more…
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/40">
                    End of feed
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
