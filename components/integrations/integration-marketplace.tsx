'use client';

import { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface CatalogItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  connected: boolean;
  status?: string;
}

export function IntegrationMarketplace({
  catalog,
  onConnect,
}: {
  catalog: CatalogItem[];
  onConnect: (key: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', ...new Set(catalog.map((c) => c.category))];
  const filtered = catalog.filter((c) => {
    if (filter !== 'all' && c.category !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded bg-background text-foreground"
          />
        </div>
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs rounded capitalize ${
                filter === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-border bg-card p-4 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {item.name}
                </h4>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {item.category.replace('_', ' ')}
                </span>
              </div>
              {item.connected && (
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : item.status === 'error'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {item.status === 'active' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : item.status === 'error' ? (
                    <XCircle className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {item.status}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex-1 mb-3">
              {item.description}
            </p>
            <button
              onClick={() => onConnect(item.key)}
              className={`w-full py-2 text-xs font-medium rounded ${
                item.connected
                  ? 'border border-border text-foreground hover:bg-muted'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {item.connected ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SyncLogEntry {
  id: string;
  event_type: string;
  direction: string;
  status: string;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

export function SyncLogViewer({ logs }: { logs: SyncLogEntry[] }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
              Event
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
              Direction
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
              Duration
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border last:border-0">
              <td className="p-3 text-xs text-foreground">
                {log.event_type.replace(/_/g, ' ')}
              </td>
              <td className="p-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  {log.direction === 'outbound' ? (
                    <ArrowRight className="h-3 w-3" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {log.direction}
                </span>
              </td>
              <td className="p-3 text-xs">
                <span
                  className={`px-2 py-0.5 rounded ${
                    log.status === 'success'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : log.status === 'error'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                  }`}
                >
                  {log.status}
                </span>
              </td>
              <td className="p-3 text-xs text-muted-foreground">
                {log.duration_ms ? `${log.duration_ms}ms` : '—'}
              </td>
              <td className="p-3 text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="p-6 text-center text-xs text-muted-foreground"
              >
                No sync events yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
