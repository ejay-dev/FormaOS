'use client';

/**
 * User Activity Dashboard
 *
 * Real-time feed of user actions across the platform
 */

import { useEffect, useState } from 'react';
import {
  Activity,
  FileText,
  UserPlus,
  Trash2,
  Settings,
  Download,
} from 'lucide-react';

type ActivityItem = {
  id: string;
  created_at: string;
  user_id: string;
  org_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  route?: string;
  metadata?: any;
  user?: { email: string; full_name?: string };
  org?: { name: string };
};

export default function UserActivityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/admin/activity?range=${timeRange}`);
      const data = await res.json();

      if (data.ok) {
        setActivity(data.activity || []);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    // Refresh every 15s
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const getActionIcon = (action: string) => {
    if (action.includes('export')) return <Download className="h-4 w-4" />;
    if (action.includes('invite') || action.includes('role'))
      return <UserPlus className="h-4 w-4" />;
    if (action.includes('delete')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('update') || action.includes('change'))
      return <Settings className="h-4 w-4" />;
    if (action.includes('view')) return <FileText className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">User Activity</h1>
          <p className="mt-1 text-sm text-slate-400">
            {activity.length} recent action{activity.length !== 1 ? 's' : ''} •
            Auto-refreshes every 15s
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      {/* Activity Feed */}
      <div className="space-y-2">
        {activity.length > 0 ? (
          activity.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900/70 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400">
                  {getActionIcon(item.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-100">
                        {item.user?.full_name ||
                          item.user?.email ||
                          'Unknown User'}
                      </p>
                      <p className="text-sm text-slate-300 mt-0.5">
                        {formatAction(item.action)}
                        {item.entity_type && (
                          <span className="text-slate-500">
                            {' '}
                            • {item.entity_type}
                            {item.entity_id &&
                              `: ${item.entity_id.substring(0, 8)}...`}
                          </span>
                        )}
                      </p>
                      {item.org && (
                        <p className="text-xs text-slate-500 mt-1">
                          Organization: {item.org.name}
                        </p>
                      )}
                      {item.route && (
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          {item.route}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center">
            <Activity className="h-16 w-16 opacity-20 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-400">No activity recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
