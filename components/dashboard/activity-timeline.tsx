'use client';

import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, type AvatarProps } from '@/components/ui/avatar-stack';

export type TimelineTone =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'violet';

const dotBg: Record<TimelineTone, string> = {
  blue: 'bg-primary text-primary-foreground',
  emerald: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/15 text-destructive',
  slate: 'bg-muted text-muted-foreground',
  violet: 'bg-muted text-muted-foreground',
};

const badgeTone: Record<'info' | 'success' | 'warning' | 'danger', string> = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

export interface TimelineItem {
  id: string;
  icon: LucideIcon;
  tone?: TimelineTone;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  timestamp: Date | string;
  actor?: AvatarProps;
  badge?: { label: string; tone?: 'info' | 'success' | 'warning' | 'danger' };
  href?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  emptyState?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

function formatRelative(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function absoluteTitle(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function ActivityTimeline({
  items,
  emptyState,
  className,
  compact,
}: ActivityTimelineProps) {
  if (items.length === 0) {
    return emptyState ? <div className={className}>{emptyState}</div> : null;
  }

  return (
    <ol className={cn('relative', className)}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        const tone = item.tone ?? 'blue';
        const isLast = idx === items.length - 1;
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-semibold text-foreground">
                {item.title}
              </div>
              <time
                dateTime={new Date(item.timestamp).toISOString()}
                title={absoluteTitle(item.timestamp)}
                className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
              >
                {formatRelative(item.timestamp)}
              </time>
            </div>
            {item.subtitle && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {item.subtitle}
              </div>
            )}
            {(item.actor || item.badge) && (
              <div className="mt-1.5 flex items-center gap-2">
                {item.actor && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Avatar {...item.actor} size="xs" />
                    {item.actor.name}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      badgeTone[item.badge.tone ?? 'info'],
                    )}
                  >
                    {item.badge.label}
                  </span>
                )}
              </div>
            )}
          </>
        );

        return (
          <li
            key={item.id}
            className={cn(
              'relative flex gap-3',
              compact ? 'pb-3 last:pb-0' : 'pb-4 last:pb-0',
            )}
          >
            {!isLast && (
              <span
                aria-hidden
                className="absolute bottom-0 left-3 top-6 w-px bg-border"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-[hsl(var(--card))]',
                dotBg[tone],
              )}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div
              className={cn(
                'min-w-0 flex-1 rounded-md',
                item.href &&
                  'transition-colors hover:bg-muted/30 -mx-2 px-2 py-1',
              )}
            >
              {item.href ? (
                <Link href={item.href} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">{body}</div>
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  </div>
                </Link>
              ) : (
                body
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
