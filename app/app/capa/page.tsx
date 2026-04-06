import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Filter,
  Plus,
} from 'lucide-react';

export const metadata = { title: 'CAPA Register' };

export default async function CAPAPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  const { data: items } = await db
    .from('org_capa_items')
    .select('*, org_incidents(title), org_investigations(id)')
    .eq('organization_id', state.organization.id)
    .order('created_at', { ascending: false });

  const capaItems = items ?? [];

  const openCount = capaItems.filter((c) => c.status === 'open').length;
  const inProgressCount = capaItems.filter(
    (c) => c.status === 'in_progress',
  ).length;
  const overdueCount = capaItems.filter(
    (c) =>
      c.due_date &&
      new Date(c.due_date) < new Date() &&
      !['verified', 'closed'].includes(c.status),
  ).length;
  const verifiedCount = capaItems.filter(
    (c) => c.status === 'verified' || c.status === 'closed',
  ).length;

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const statusIcons: Record<string, typeof Clock> = {
    open: Clock,
    in_progress: Wrench,
    implemented: AlertTriangle,
    verified: CheckCircle2,
    closed: CheckCircle2,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">CAPA Register</h1>
          <p className="page-description">Corrective and Preventive Actions tracking</p>
        </div>
        <Link
          href="/app/capa/new"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New CAPA
        </Link>
      </div>

      <div className="page-content space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="metric-card metric-card-neutral">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open</p>
          </div>
          <p className="text-2xl font-bold">{openCount}</p>
        </div>
        <div className="metric-card metric-card-neutral">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">In Progress</p>
          </div>
          <p className="text-2xl font-bold">{inProgressCount}</p>
        </div>
        <div className={`metric-card ${overdueCount > 0 ? 'metric-card-danger' : 'metric-card-success'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overdue</p>
          </div>
          <p className="text-2xl font-bold">{overdueCount}</p>
        </div>
        <div className="metric-card metric-card-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verified</p>
          </div>
          <p className="text-2xl font-bold">{verifiedCount}</p>
        </div>
      </div>

      {/* CAPA Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Priority</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Due Date</th>
              <th className="text-left px-4 py-3 font-medium">Incident</th>
              <th className="text-left px-4 py-3 font-medium">Effectiveness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {capaItems.map((item) => {
              const Icon = statusIcons[item.status] ?? Clock;
              const isOverdue =
                item.due_date &&
                new Date(item.due_date) < new Date() &&
                !['verified', 'closed'].includes(item.status);
              return (
                <tr
                  key={item.id}
                  className={`hover:bg-muted/30 ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/capa/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'corrective'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Icon className="h-3.5 w-3.5" />{' '}
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.due_date ? (
                      <span
                        className={isOverdue ? 'text-red-600 font-medium' : ''}
                      >
                        {new Date(item.due_date).toLocaleDateString()}
                        {isOverdue && ' (overdue)'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.incident_id ? (
                      <Link
                        href={`/app/incidents/${item.incident_id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        {(item.org_incidents as { title: string })?.title ??
                          'View'}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">
                    {item.effectiveness_status}
                  </td>
                </tr>
              );
            })}
            {!capaItems.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No CAPA items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
