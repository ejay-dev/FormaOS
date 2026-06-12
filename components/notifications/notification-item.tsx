'use client';

import { useRef } from 'react';
import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';
import {
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileWarning,
  Siren,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import type { NotificationRecord } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';

const TYPE_META: Record<
  string,
  { icon: typeof BellRing; tone: string; badge: string }
> = {
  'task.assigned': {
    icon: CheckCircle2,
    tone: 'text-info',
    badge: 'bg-info/10 border-info/20',
  },
  'task.due_soon': {
    icon: BellRing,
    tone: 'text-warning',
    badge: 'bg-warning/10 border-warning/20',
  },
  'task.overdue': {
    icon: FileWarning,
    tone: 'text-destructive',
    badge: 'bg-destructive/10 border-destructive/20',
  },
  'evidence.review_requested': {
    icon: FileWarning,
    tone: 'text-info',
    badge: 'bg-info/10 border-info/20',
  },
  'evidence.approved': {
    icon: FileCheck2,
    tone: 'text-success',
    badge: 'bg-success/10 border-success/20',
  },
  'evidence.rejected': {
    icon: FileWarning,
    tone: 'text-destructive',
    badge: 'bg-destructive/10 border-destructive/20',
  },
  'member.joined': {
    icon: Users,
    tone: 'text-muted-foreground',
    badge: 'bg-muted border-border',
  },
  'member.removed': {
    icon: Users,
    tone: 'text-destructive',
    badge: 'bg-destructive/10 border-destructive/20',
  },
  'member.role_changed': {
    icon: Users,
    tone: 'text-muted-foreground',
    badge: 'bg-muted border-border',
  },
  'workflow.approval_requested': {
    icon: Workflow,
    tone: 'text-warning',
    badge: 'bg-warning/10 border-warning/20',
  },
  'workflow.completed': {
    icon: Workflow,
    tone: 'text-success',
    badge: 'bg-success/10 border-success/20',
  },
  'workflow.failed': {
    icon: Workflow,
    tone: 'text-destructive',
    badge: 'bg-destructive/10 border-destructive/20',
  },
  'system.security_alert': {
    icon: Siren,
    tone: 'text-destructive',
    badge: 'bg-destructive/10 border-destructive/20',
  },
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  const relative = formatDistanceToNowStrict(date, { addSuffix: true });

  if (isToday(date)) {
    return `${relative} · ${format(date, 'p')}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'p')}`;
  }

  return format(date, 'MMM d, p');
}

interface NotificationItemProps {
  notification: NotificationRecord;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onView: (notification: NotificationRecord) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onArchive,
  onView,
}: NotificationItemProps) {
  const touchStartX = useRef<number | null>(null);
  const meta = TYPE_META[notification.type] ?? {
    icon: BellRing,
    tone: 'text-foreground',
    badge: 'bg-surface-2 border-edge-2',
  };
  const Icon = meta.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(notification)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView(notification);
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX ?? null;
        if (start != null && end != null && start - end > 80) {
          onArchive(notification.id);
        }
        touchStartX.current = null;
      }}
      className={cn(
        'group rounded-2xl border px-4 py-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        notification.read_at
          ? 'border-border bg-surface-1'
          : 'border-primary/30 bg-surface-2 shadow-[0_0_0_1px_hsl(var(--primary)/0.08)]',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
            meta.badge,
          )}
        >
          <Icon className={cn('h-4 w-4', meta.tone)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {notification.title}
                </h3>
                {!notification.read_at && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {notification.body}
              </p>
            </div>

            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/60">
              {formatTimestamp(notification.created_at)}
            </p>

            <div className="flex items-center gap-1">
              {!notification.read_at && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                  className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-primary/30 hover:bg-muted hover:text-foreground"
                  aria-label="Mark notification as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onArchive(notification.id);
                }}
                className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                aria-label="Archive notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
