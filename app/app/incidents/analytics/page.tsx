import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import {
  getIncidentStats,
  getIncidentTrend,
  getMTTR,
  detectPatterns,
  getIncidentHeatmap,
} from '@/lib/incidents/analytics';
import { IncidentTrendChart } from '@/components/incidents/incident-trend-chart';
import { IncidentTypeChart } from '@/components/incidents/incident-type-chart';
import { MTTRChart } from '@/components/incidents/mttr-chart';
import { IncidentHeatmap } from '@/components/incidents/incident-heatmap';
import { BarChart3, AlertTriangle, Clock, Repeat } from 'lucide-react';

export const metadata = { title: 'Incident Analytics' };

export default async function IncidentAnalyticsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const orgId = state.organization.id;

  // Default: last 12 months
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const dateRange = { from, to };

  const [stats, trend, mttr, patterns, heatmap] = await Promise.all([
    getIncidentStats(orgId, dateRange),
    getIncidentTrend(orgId, dateRange, 'month'),
    getMTTR(orgId, dateRange),
    detectPatterns(orgId, dateRange),
    getIncidentHeatmap(orgId, dateRange),
  ]);

  const openCount =
    (stats.byStatus?.open ?? 0) + (stats.byStatus?.in_progress ?? 0);
  const resolvedCount = stats.byStatus?.resolved ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Incident Analytics</h1>
        <p className="text-muted-foreground">
          Review incident patterns, resolution times, and trends.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <BarChart3 className="h-4 w-4" /> Total Incidents
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" /> Open
          </div>
          <p className="text-2xl font-bold">{openCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <Clock className="h-4 w-4" /> Resolved
          </div>
          <p className="text-2xl font-bold">{resolvedCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <Repeat className="h-4 w-4" /> Recurring Patterns
          </div>
          <p className="text-2xl font-bold">{patterns.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <IncidentTrendChart data={trend} title="Monthly Incident Trend" />
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <IncidentTypeChart data={stats.byType} />
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <MTTRChart data={mttr} />
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <IncidentTypeChart
            data={stats.bySeverity}
            title="Incidents by Severity"
          />
        </div>
      </div>

      {/* Heatmap */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <IncidentHeatmap grid={heatmap} />
      </div>

      {/* Recurring Patterns */}
      {patterns.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="text-sm font-medium mb-3">Recurring Patterns</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-left px-3 py-2 font-medium">Location</th>
                  <th className="text-left px-3 py-2 font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patterns.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-3 py-2 capitalize">
                      {p.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-2">{p.location ?? 'Unknown'}</td>
                    <td className="px-3 py-2 font-medium">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
