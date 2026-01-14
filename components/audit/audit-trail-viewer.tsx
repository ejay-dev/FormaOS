'use client';

/**
 * =========================================================
 * Audit Trail Viewer Component
 * =========================================================
 * Searchable, filterable activity history
 */

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Shield, AlertTriangle } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_name?: string;
  details?: Record<string, any>;
  created_at: string;
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface AuditTrailViewerProps {
  orgId: string;
}

export default function AuditTrailViewer({ orgId }: AuditTrailViewerProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    actions: [] as string[],
    entityTypes: [] as string[],
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const pageSize = 50;

  useEffect(() => {
    fetchLogs();
  }, [orgId, filters, page]);

  const fetchLogs = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        orgId,
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
        ...filters,
      });

      const res = await fetch(`/api/audit/logs?${params}`);
      const data = await res.json();

      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ orgId, ...filters });
      const res = await fetch(`/api/audit/export?${params}`);
      const csv = await res.text();

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString()}.csv`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'approve':
        return 'bg-emerald-100 text-emerald-800';
      case 'reject':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Trail
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Complete activity history for your organization
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search activity..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
            showFilters ? 'bg-gray-50' : ''
          }`}
        >
          <Filter className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <div className="grid grid-cols-3 gap-4">
            {/* Date range */}
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium mb-2">Actions</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {['create', 'update', 'delete', 'view', 'export', 'approve', 'reject'].map(
                  (action) => (
                    <label key={action} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.actions.includes(action)}
                        onChange={(e) => {
                          setFilters({
                            ...filters,
                            actions: e.target.checked
                              ? [...filters.actions, action]
                              : filters.actions.filter((a) => a !== action),
                          });
                        }}
                        className="mr-2"
                      />
                      <span className="capitalize text-sm">{action}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Entity Types */}
            <div>
              <label className="block text-sm font-medium mb-2">Entity Types</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {['task', 'certificate', 'evidence', 'member', 'organization'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.entityTypes.includes(type)}
                      onChange={(e) => {
                        setFilters({
                          ...filters,
                          entityTypes: e.target.checked
                            ? [...filters.entityTypes, type]
                            : filters.entityTypes.filter((t) => t !== type),
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="capitalize text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {logs.length} of {total} activities
      </div>

      {/* Activity List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity found</div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* User avatar */}
                  <div className="flex-shrink-0">
                    {log.user?.avatar_url ? (
                      <img
                        src={log.user.avatar_url}
                        alt={log.user.full_name || 'User'}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                        {log.user?.full_name?.[0] || log.user?.email?.[0] || '?'}
                      </div>
                    )}
                  </div>

                  {/* Activity details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {log.user?.full_name || log.user?.email || 'Unknown user'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-gray-600 capitalize text-sm">
                        {log.entity_type}
                      </span>
                      {log.entity_name && (
                        <span className="text-gray-900 font-medium text-sm">
                          {log.entity_name}
                        </span>
                      )}
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-1 text-sm text-gray-600">
                        {JSON.stringify(log.details)}
                      </div>
                    )}

                    <div className="mt-1 text-xs text-gray-500">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * pageSize >= total}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
