'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Sparkles } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { ActivityFeedRecord } from '@/lib/notifications/types';
import { ActivityItem } from './activity-item';

type ActivityResponse = {
  items: ActivityFeedRecord[];
  nextCursor: string | null;
};

function shouldGroup(a: ActivityFeedRecord, b: ActivityFeedRecord) {
  if (!a || !b) return false;

  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();

  return (
    a.actor_id === b.actor_id &&
    a.action === b.action &&
    a.resource_type === b.resource_type &&
    Math.abs(aTime - bTime) <= 60 * 60 * 1000
  );
}

function groupActivities(items: ActivityFeedRecord[]) {
  const groups: Array<{ lead: ActivityFeedRecord; items: ActivityFeedRecord[] }> = [];

  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && shouldGroup(last.lead, item)) {
      last.items.push(item);
    } else {
      groups.push({ lead: item, items: [item] });
    }
  }

  return groups;
}

export function ActivityFeed({ orgId }: { orgId: string }) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [items, setItems] = useState<ActivityFeedRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    actorId: '',
    resourceType: '',
    dateFrom: '',
    dateTo: '',
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const load = useCallback(
    async (cursor?: string | null, append?: boolean) => {
      const params = new URLSearchParams({ orgId, limit: '25' });
      if (filters.action) params.set('action', filters.action);
      if (filters.actorId) params.set('actorId', filters.actorId);
      if (filters.resourceType) params.set('resourceType', filters.resourceType);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (cursor) params.set('cursor', cursor);

      append ? setLoadingMore(true) : setLoading(true);

      try {
        const response = await fetch(`/api/activity?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;

        const payload = (await response.json()) as ActivityResponse;
        setItems((current) =>
          append ? [...current, ...payload.items] : payload.items,
        );
        setNextCursor(payload.nextCursor);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, orgId],
  );

  useEffect(() => {
    void load(null, false);
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`activity-feed:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `org_id=eq.${orgId}`,
        },
        (payload: any) => {
          const next = payload.new as ActivityFeedRecord;
          setItems((current) => [next, ...current]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, supabase]);

  const groups = useMemo(() => groupActivities(items), [items]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={filters.action}
            onChange={(event) =>
              setFilters((current) => ({ ...current, action: event.target.value }))
            }
            placeholder="Action"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
          />
          <input
            value={filters.actorId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, actorId: event.target.value }))
            }
            placeholder="Actor ID"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
          />
          <input
            value={filters.resourceType}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                resourceType: event.target.value,
              }))
            }
            placeholder="Resource type"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              setFilters((current) => ({ ...current, dateFrom: event.target.value }))
            }
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              setFilters((current) => ({ ...current, dateTo: event.target.value }))
            }
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void load(null, false)}
            className="rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100"
          >
            Apply Filters
          </button>
          <a
            href={`/api/activity?orgId=${encodeURIComponent(orgId)}&format=csv`}
            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-200"
          >
            <Download className="mr-2 inline h-3.5 w-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-16 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading activity feed
        </div>
      ) : !groups.length ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.04] px-6 py-16 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-4 text-sm font-semibold text-slate-200">
            No activity matched the current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const key = `${group.lead.id}:${group.items.length}`;
            const expanded = expandedGroups[key] ?? false;
            const visibleItems = expanded ? group.items : [group.lead];

            return (
              <div key={key} className="space-y-3">
                {visibleItems.map((item, index) => (
                  <ActivityItem
                    key={item.id}
                    item={item}
                    groupedCount={index === 0 ? group.items.length : undefined}
                  />
                ))}

                {group.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [key]: !expanded,
                      }))
                    }
                    className="text-xs font-black uppercase tracking-[0.22em] text-sky-200"
                  >
                    {expanded ? 'Collapse group' : `Show ${group.items.length - 1} more`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => void load(nextCursor, true)}
          disabled={!nextCursor || loadingMore}
          className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-200 disabled:opacity-40"
        >
          {loadingMore ? 'Loading…' : nextCursor ? 'Load more' : 'End of feed'}
        </button>
      </div>
    </div>
  );
}
