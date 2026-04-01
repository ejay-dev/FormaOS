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
      className="group rounded-[1.75rem] border border-glass-border bg-white/[0.04] px-5 py-4 transition hover:border-sky-400/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {describeActivity(item)}
            </span>
            {groupedCount && groupedCount > 1 && (
              <span className="rounded-full border border-glass-border bg-white/[0.06] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
                {groupedCount} events
              </span>
            )}
            {delta != null && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${
                  delta >= 0
                    ? 'bg-emerald-500/15 text-emerald-200'
                    : 'bg-rose-500/15 text-rose-200'
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
