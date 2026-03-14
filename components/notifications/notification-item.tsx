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
  ShieldAlert,
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
    tone: 'text-sky-200',
    badge: 'bg-sky-500/15 border-sky-400/30',
  },
  'task.due_soon': {
    icon: BellRing,
    tone: 'text-amber-200',
    badge: 'bg-amber-500/15 border-amber-400/30',
  },
  'task.overdue': {
    icon: FileWarning,
    tone: 'text-rose-200',
    badge: 'bg-rose-500/15 border-rose-400/30',
  },
  'evidence.review_requested': {
    icon: FileWarning,
    tone: 'text-cyan-200',
    badge: 'bg-cyan-500/15 border-cyan-400/30',
  },
  'evidence.approved': {
    icon: FileCheck2,
    tone: 'text-emerald-200',
    badge: 'bg-emerald-500/15 border-emerald-400/30',
  },
  'evidence.rejected': {
    icon: FileWarning,
    tone: 'text-rose-200',
    badge: 'bg-rose-500/15 border-rose-400/30',
  },
  'member.joined': {
    icon: Users,
    tone: 'text-violet-200',
    badge: 'bg-violet-500/15 border-violet-400/30',
  },
  'member.removed': {
    icon: Users,
    tone: 'text-rose-200',
    badge: 'bg-rose-500/15 border-rose-400/30',
  },
  'member.role_changed': {
    icon: Users,
    tone: 'text-fuchsia-200',
    badge: 'bg-fuchsia-500/15 border-fuchsia-400/30',
  },
  'workflow.approval_requested': {
    icon: Workflow,
    tone: 'text-orange-200',
    badge: 'bg-orange-500/15 border-orange-400/30',
  },
  'workflow.completed': {
    icon: Workflow,
    tone: 'text-emerald-200',
    badge: 'bg-emerald-500/15 border-emerald-400/30',
  },
  'workflow.failed': {
    icon: Workflow,
    tone: 'text-rose-200',
    badge: 'bg-rose-500/15 border-rose-400/30',
  },
  'system.security_alert': {
    icon: Siren,
    tone: 'text-rose-100',
    badge: 'bg-rose-500/20 border-rose-300/40',
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
    tone: 'text-slate-200',
    badge: 'bg-white/10 border-white/10',
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
        'group rounded-2xl border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/40',
        notification.read_at
          ? 'border-white/10 bg-white/[0.04]'
          : 'border-sky-400/25 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]',
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
                <h3 className="truncate text-sm font-semibold text-slate-100">
                  {notification.title}
                </h3>
                {!notification.read_at && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-sky-300" />
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                {notification.body}
              </p>
            </div>

            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
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
                  className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-sky-100"
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
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-100"
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
