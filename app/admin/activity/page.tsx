'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Download,
  FileText,
  Settings,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useRealtimeActivity } from '@/lib/hooks/use-realtime-security';

type ActivityRecord = {
  id: string;
  created_at: string;
  user_id: string;
  org_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  route: string | null;
  metadata: Record<string, unknown> | null;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  org: {
    id: string;
    name: string;
  } | null;
};

export default function UserActivityPage() {
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchActivity = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: timeRange });
      const res = await fetch(`/api/admin/activity?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error ?? 'Failed to load activity');
      }
      setActivity((data.activity ?? []) as ActivityRecord[]);
      setError(null);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    void fetchActivity();
    const interval = setInterval(() => {
      void fetchActivity();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const { connected } = useRealtimeActivity(
    useCallback(() => {
      void fetchActivity();
    }, [fetchActivity]),
  );

  const getActionIcon = (action: string) => {
    if (action.includes('export')) return <Download className="h-4 w-4" />;
    if (action.includes('invite') || action.includes('role')) {
      return <UserPlus className="h-4 w-4" />;
    }
    if (action.includes('delete')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('update') || action.includes('change')) {
      return <Settings className="h-4 w-4" />;
    }
    if (action.includes('view')) return <FileText className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const formatAction = (action: string) =>
    action.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  const relativeTime = (value: string) => {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-slate-400">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">User Activity</h1>
          <p className="mt-1 text-sm text-slate-400">
            {activity.length} recent action{activity.length === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
              connected
                ? 'border-emerald-700 bg-emerald-900/20 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            {connected ? 'Realtime connected' : 'Realtime reconnecting'}
          </span>
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {activity.length ? (
          activity.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:bg-slate-900/70"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400">
                  {getActionIcon(item.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-100">
                        {item.user.full_name || item.user.email || item.user_id}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-300">
                        {formatAction(item.action)}
                        {item.entity_type && (
                          <span className="text-slate-500">
                            {' '}
                            • {item.entity_type}
                            {item.entity_id ? `: ${item.entity_id.slice(0, 12)}...` : ''}
                          </span>
                        )}
                      </p>
                      {item.org?.name && (
                        <p className="mt-1 text-xs text-slate-500">
                          Organization: {item.org.name}
                        </p>
                      )}
                      {item.route && (
                        <p className="mt-1 break-all font-mono text-xs text-slate-500">
                          {item.route}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {relativeTime(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center">
            <Activity className="mx-auto mb-4 h-16 w-16 text-slate-500/30" />
            <p className="text-slate-400">No activity recorded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
