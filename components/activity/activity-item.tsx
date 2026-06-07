'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { ActivityFeedRecord } from '@/lib/notifications/types';

function describeActivity(item: ActivityFeedRecord) {
  const actor = item.actor_name || item.actor_email || 'System';
  const resource = item.resource_name || item.resource_type;
  return `${actor} ${item.action} ${resource}`;
}

export function ActivityItem({
  item,
  groupedCount,
}: {
  item: ActivityFeedRecord;
  groupedCount?: number;
}) {
  const router = useRouter();
  const path =
    typeof item.metadata?.path === 'string' ? item.metadata.path : null;
  const delta =
    typeof item.metadata?.scoreDelta === 'number'
      ? item.metadata.scoreDelta
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (path) router.push(path);
      }}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && path) {
          event.preventDefault();
          router.push(path);
        }
      }}
      className="group rounded-[1.75rem] border border-border bg-surface-1 px-5 py-4 transition hover:border-primary/30 hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {describeActivity(item)}
            </span>
            {groupedCount && groupedCount > 1 && (
              <span className="rounded-full border border-edge-2 bg-surface-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
                {groupedCount} events
              </span>
            )}
            {delta != null && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${
                  delta >= 0
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {delta} points
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.resource_type}
            {item.resource_name ? ` • ${item.resource_name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <Clock3 className="h-3.5 w-3.5" />
          {formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true })}
          {path && <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />}
        </div>
      </div>
    </div>
  );
}
