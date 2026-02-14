'use client';

/**
 * Security Live Dashboard
 *
 * Real-time security alerts and events monitoring
 * Shows: open alerts, recent events, detection rule triggers
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, Clock, X } from 'lucide-react';
import Link from 'next/link';

type Alert = {
  id: string;
  created_at: string;
  status: string;
  notes?: string;
  event: {
    id: string;
    type: string;
    severity: string;
    created_at: string;
    user_id?: string;
    ip_address?: string;
    geo_country?: string;
    request_path?: string;
    metadata?: any;
  };
};

type SecurityEvent = {
  id: string;
  type: string;
  severity: string;
  created_at: string;
  user_id?: string;
  org_id?: string;
  ip_address?: string;
  geo_country?: string;
  request_path?: string;
  metadata?: any;
};

export default function SecurityLivePage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState({
    openAlerts: 0,
    criticalEvents: 0,
    totalEvents: 0,
    timeRange: '24h',
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [statusFilter, setStatusFilter] = useState('open');

  const fetchData = async () => {
    try {
      const res = await fetch(
        `/api/admin/security-live?range=${timeRange}&status=${statusFilter}`,
      );
      const data = await res.json();

      if (data.ok) {
        setAlerts(data.alerts || []);
        setEvents(data.events || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeRange, statusFilter]);

  const updateAlertStatus = async (
    alertId: string,
    status: string,
    notes?: string,
  ) => {
    try {
      await fetch('/api/admin/security-live', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status, notes }),
      });
      fetchData(); // Refresh
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-900/20 text-red-300';
      case 'high':
        return 'border-red-700 bg-red-900/10 text-red-300';
      case 'medium':
        return 'border-amber-700 bg-amber-900/10 text-amber-300';
      default:
        return 'border-slate-700 bg-slate-800/20 text-slate-300';
    }
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
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading security data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Security Live</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time security monitoring and alerts
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All Alerts</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-red-800/40 bg-red-900/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-300/70">Open Alerts</p>
              <p className="text-3xl font-bold text-red-300">
                {summary.openAlerts}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-300/70">
                Critical Events
              </p>
              <p className="text-3xl font-bold text-amber-300">
                {summary.criticalEvents}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-400">Total Events</p>
              <p className="text-3xl font-bold text-slate-200">
                {summary.totalEvents}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link
          href="/admin/sessions"
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60"
        >
          Active Sessions →
        </Link>
        <Link
          href="/admin/activity"
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60"
        >
          User Activity →
        </Link>
      </div>

      {/* Alerts Section */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Security Alerts
        </h2>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${getSeverityColor(alert.event.severity)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold capitalize">
                        {alert.event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="rounded px-2 py-0.5 text-xs font-medium bg-slate-900/50">
                        {alert.event.severity}
                      </span>
                      <span className="rounded px-2 py-0.5 text-xs font-medium bg-slate-900/50 capitalize">
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-sm opacity-90">
                      IP: {alert.event.ip_address}{' '}
                      {alert.event.geo_country &&
                        `(${alert.event.geo_country})`}
                      {alert.event.request_path &&
                        ` • Path: ${alert.event.request_path}`}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDate(alert.event.created_at)}
                    </p>
                    {alert.notes && (
                      <p className="text-sm mt-2 italic opacity-80">
                        {alert.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {alert.status === 'open' && (
                      <>
                        <button
                          onClick={() =>
                            updateAlertStatus(alert.id, 'acknowledged')
                          }
                          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
                          title="Acknowledge"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            updateAlertStatus(
                              alert.id,
                              'false_positive',
                              'Marked as false positive',
                            )
                          }
                          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
                          title="False Positive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <button
                        onClick={() =>
                          updateAlertStatus(
                            alert.id,
                            'resolved',
                            'Issue resolved',
                          )
                        }
                        className="rounded-lg border border-emerald-700 bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900/30"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Shield className="h-12 w-12 opacity-20 mx-auto mb-3" />
              <p>No alerts found</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Events */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Recent Security Events
        </h2>
        <div className="space-y-2">
          {events.slice(0, 20).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 text-sm"
            >
              <div className="flex-1">
                <span className="font-medium capitalize">
                  {event.type.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-500 mx-2">•</span>
                <span className="text-slate-400">
                  {event.ip_address}{' '}
                  {event.geo_country && `(${event.geo_country})`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    event.severity === 'high' || event.severity === 'critical'
                      ? 'bg-red-900/30 text-red-300'
                      : event.severity === 'medium'
                        ? 'bg-amber-900/30 text-amber-300'
                        : 'bg-slate-700/30 text-slate-400'
                  }`}
                >
                  {event.severity}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDate(event.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
