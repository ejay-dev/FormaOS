/**
 * Form Submissions Viewer Page
 * View, review, and export form submissions
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  BarChart3,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'reviewed':
      return <Eye className="h-4 w-4 text-info" />;
    default:
      return <Clock className="h-4 w-4 text-warning" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-success/10 text-success border-success/20';
    case 'rejected':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'reviewed':
      return 'bg-info/10 text-info border-info/20';
    default:
      return 'bg-warning/10 text-warning border-warning/20';
  }
}

export default async function FormSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams?: Promise<{ status?: string; page?: string; view?: string }>;
}) {
  const { formId } = await params;
  const search = (await searchParams) ?? {};
  const statusFilter = (search.status ?? '').trim();
  const activeView = search.view === 'analytics' ? 'analytics' : 'submissions';
  const page = Math.max(1, parseInt(search.page ?? '1', 10));
  const limit = 25;

  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/workspace-recovery?from=form-submissions');
  }

  const supabase = await createSupabaseServerClient();
  const orgId = systemState.organization.id;

  // Load form
  const { data: form } = await supabase
    .from('org_forms')
    .select('id, title, fields, status')
    .eq('id', formId)
    .eq('org_id', orgId)
    .single();

  if (!form) {
    redirect('/app/forms');
  }

  const { data: analyticsRows } = await supabase
    .from('org_form_submissions')
    .select('status, data, created_at')
    .eq('form_id', formId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1000);

  // Load submissions
  let query = supabase
    .from('org_form_submissions')
    .select('*', { count: 'exact' })
    .eq('form_id', formId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: submissions, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  const fields = (form.fields ?? []) as Array<{
    id: string;
    label: string;
    type: string;
  }>;
  const displayFields = fields.slice(0, 4);
  const allRows = analyticsRows ?? [];
  const stats = {
    total: allRows.length,
    submitted: allRows.filter((s) => s.status === 'submitted').length,
    approved: allRows.filter((s) => s.status === 'approved').length,
    rejected: allRows.filter((s) => s.status === 'rejected').length,
  };
  const fieldCompletion = fields.map((field) => {
    const answered = allRows.filter((submission) => {
      const data = (submission.data ?? {}) as Record<string, unknown>;
      const value = data[field.id];
      return Array.isArray(value)
        ? value.length > 0
        : value !== null && value !== undefined && String(value).trim() !== '';
    }).length;
    return {
      ...field,
      answered,
      percentage:
        allRows.length > 0 ? Math.round((answered / allRows.length) * 100) : 0,
    };
  });
  const recentVolume = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const countForDay = allRows.filter((submission) =>
      String(submission.created_at ?? '').startsWith(key),
    ).length;
    return { key, label: date.toLocaleDateString('en-AU', { weekday: 'short' }), count: countForDay };
  });
  const maxDaily = Math.max(1, ...recentVolume.map((day) => day.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/forms"
            className="min-h-[44px] md:min-h-0 p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="page-title">
              {form.title} — Submissions
            </h1>
            <p className="text-sm text-muted-foreground">
              {count ?? 0} submission{(count ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/api/v1/forms/${formId}/submissions/export?format=csv`}
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
          <Link
            href={`/app/forms/${formId}/submissions?view=${activeView === 'analytics' ? 'submissions' : 'analytics'}`}
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            {activeView === 'analytics' ? 'Submissions' : 'Analytics'}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-2xl font-bold text-warning">{stats.submitted}</p>
          <p className="text-sm text-muted-foreground">Pending Review</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-2xl font-bold text-success">{stats.approved}</p>
          <p className="text-sm text-muted-foreground">Approved</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
          <p className="text-sm text-muted-foreground">Rejected</p>
        </div>
      </div>

      {activeView === 'analytics' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Status Distribution
            </h2>
            <div className="mt-4 space-y-3">
              {[
                ['Submitted', stats.submitted, 'bg-warning'],
                ['Approved', stats.approved, 'bg-success'],
                ['Rejected', stats.rejected, 'bg-destructive'],
              ].map(([label, value, color]) => {
                const pct =
                  stats.total > 0
                    ? Math.round((Number(value) / stats.total) * 100)
                    : 0;
                return (
                  <div key={String(label)}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{label}</span>
                      <span>{value} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Last 7 Days
            </h2>
            <div className="mt-4 flex h-32 items-end gap-2">
              {recentVolume.map((day) => (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-primary/70"
                    style={{
                      height: `${Math.max(6, (day.count / maxDaily) * 100)}%`,
                    }}
                    title={`${day.count} submissions`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold">Field Completion</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {fieldCompletion.map((field) => (
                <div key={field.id} className="rounded-lg border border-border p-3">
                  <div className="mb-1 flex justify-between gap-3 text-xs">
                    <span className="font-medium">{field.label}</span>
                    <span className="text-muted-foreground">
                      {field.answered}/{stats.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${field.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {fieldCompletion.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No fields configured for this form.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : (
        <>
          {/* Status Filters */}
          <div className="flex gap-2">
            {['', 'submitted', 'approved', 'rejected'].map((s) => (
              <Link
                key={s}
                href={`/app/forms/${formId}/submissions${s ? `?status=${s}` : ''}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-accent'
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </Link>
            ))}
          </div>

          {/* Submissions Table */}
          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">No submissions yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Submissions will appear here once respondents fill out the form.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full" data-testid="submissions-table">
            <thead>
              <tr className="bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Respondent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {displayFields.map((field) => (
                  <th
                    key={field.id}
                    className="px-4 py-3 font-medium hidden lg:table-cell"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((sub) => {
                const subData = (sub.data ?? {}) as Record<string, unknown>;
                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">
                        {sub.respondent_name ||
                          sub.respondent_email ||
                          'Anonymous'}
                      </div>
                      {sub.respondent_email && sub.respondent_name && (
                        <div className="text-xs text-muted-foreground">
                          {sub.respondent_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(sub.status)}`}
                      >
                        {getStatusIcon(sub.status)}
                        {sub.status}
                      </span>
                    </td>
                    {displayFields.map((field) => (
                      <td
                        key={field.id}
                        className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell max-w-[200px] truncate"
                      >
                        {String(subData[field.id] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(sub.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/app/forms/${formId}/submissions?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                  className="min-h-[44px] md:min-h-0 px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm"
                >
                  Previous
                </Link>
              )}
              <span className="px-3 py-2 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/app/forms/${formId}/submissions?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                  className="min-h-[44px] md:min-h-0 px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
