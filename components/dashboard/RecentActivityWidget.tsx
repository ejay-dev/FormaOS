'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Download,
  Eye,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  ActivityTimeline,
  type TimelineItem,
  type TimelineTone,
} from '@/components/dashboard/activity-timeline';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { RecentActivityItem } from '@/app/api/dashboard/recent-activity/route';

const actionIcon: Record<string, LucideIcon> = {
  create: Plus,
  update: CheckSquare,
  delete: Trash2,
  view: Eye,
  export: Download,
  import: Upload,
  login: LogIn,
  logout: LogOut,
  invite: UserPlus,
  approve: CheckCircle2,
  reject: XCircle,
  assign: ArrowRight,
  complete: CheckCircle2,
};

const actionTone: Record<string, TimelineTone> = {
  create: 'blue',
  update: 'slate',
  delete: 'rose',
  view: 'slate',
  export: 'violet',
  import: 'violet',
  login: 'slate',
  logout: 'slate',
  invite: 'blue',
  approve: 'emerald',
  reject: 'rose',
  assign: 'slate',
  complete: 'emerald',
};

function actionPhrase(action: string): string {
  const map: Record<string, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    view: 'viewed',
    export: 'exported',
    import: 'imported',
    login: 'signed in',
    logout: 'signed out',
    invite: 'invited',
    approve: 'approved',
    reject: 'rejected',
    assign: 'assigned',
    complete: 'completed',
  };
  return map[action] ?? action;
}

function entityLabel(entityType: string): string {
  const map: Record<string, string> = {
    task: 'task',
    certificate: 'certificate',
    evidence: 'evidence',
    member: 'team member',
    organization: 'organization',
    role: 'role',
    permission: 'permission',
    report: 'report',
    workflow: 'workflow',
    auth: 'session',
  };
  return map[entityType] ?? entityType;
}

export function RecentActivityWidget() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/recent-activity', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('fetch failed');
        const data: { items: RecentActivityItem[] } = await res.json();
        if (!mounted) return;

        // Resolve avatar signed URLs in parallel.
        const avatarPaths = Array.from(
          new Set(
            data.items
              .map((it) => it.actor?.avatarPath)
              .filter((p): p is string => Boolean(p)),
          ),
        );

        const urlMap = new Map<string, string>();
        if (avatarPaths.length > 0) {
          const signed = await Promise.all(
            avatarPaths.map((p) =>
              supabase.storage
                .from('user-avatars')
                .createSignedUrl(p, 60 * 60 * 12),
            ),
          );
          avatarPaths.forEach((p, i) => {
            const url = signed[i]?.data?.signedUrl;
            if (url) urlMap.set(p, url);
          });
        }

        if (!mounted) return;

        const mapped: TimelineItem[] = data.items.map((it) => {
          const Icon = actionIcon[it.action] ?? CheckSquare;
          const tone = actionTone[it.action] ?? 'slate';
          const actorName = it.actor?.name ?? 'Someone';
          const entityName = it.entityName ?? entityLabel(it.entityType);
          const phrase = actionPhrase(it.action);
          const avatarUrl =
            it.actor?.avatarPath && urlMap.has(it.actor.avatarPath)
              ? (urlMap.get(it.actor.avatarPath) as string)
              : null;

          return {
            id: it.id,
            icon: Icon,
            tone,
            title: (
              <span>
                <span className="font-semibold text-foreground">
                  {actorName}
                </span>{' '}
                <span className="font-normal text-muted-foreground">
                  {phrase}
                </span>{' '}
                <span className="font-semibold text-foreground">
                  {entityName}
                </span>
              </span>
            ),
            subtitle: entityLabel(it.entityType),
            timestamp: it.createdAt,
            actor: it.actor
              ? {
                  name: actorName,
                  src: avatarUrl,
                }
              : undefined,
          };
        });

        setItems(mapped);
      } catch {
        if (!mounted) return;
        setError(true);
        setItems([]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Recent activity
        </h3>
        <span className="text-[11px] text-muted-foreground">Last 8</span>
      </div>

      {items === null ? (
        <div className="space-y-3" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-muted/50" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-6 text-center">
          <p className="text-xs font-medium text-foreground">
            {error ? 'Activity unavailable' : 'No recent activity yet'}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {error
              ? 'Refresh to try again.'
              : 'Actions across the workspace will appear here.'}
          </p>
        </div>
      ) : (
        <ActivityTimeline items={items} compact />
      )}
    </div>
  );
}
