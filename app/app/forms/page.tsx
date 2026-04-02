/**
 * Forms Management Page
 * List, create, and manage forms with status filtering
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Copy,
  Archive,
  BarChart3,
  ExternalLink,
  MoreVertical,
  ClipboardList,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'published':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'draft':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'archived':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export default async function FormsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? '').trim();
  const statusFilter = (params.status ?? '').trim();

  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/workspace-recovery?from=forms-page');
  }

  const supabase = await createSupabaseServerClient();
  const orgId = systemState.organization.id;

  let forms: Array<{
    id: string;
    title: string;
    description: string | null;
    slug: string;
    status: string;
    version: number;
    created_at: string;
    published_at: string | null;
    updated_at: string;
    submission_count: Array<{ count: number }> | null;
  }> = [];

  try {
    let query = supabase
      .from('org_forms')
      .select('*, submission_count:org_form_submissions(count)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[FormsPage] Error fetching forms:', error);
    } else {
      forms = data ?? [];
    }
  } catch (err) {
    console.error('[FormsPage] Error:', err);
  }

  const stats = {
    total: forms.length,
    published: forms.filter((f) => f.status === 'published').length,
    draft: forms.filter((f) => f.status === 'draft').length,
    totalSubmissions: forms.reduce(
      (sum, f) => sum + ((f.submission_count as any)?.[0]?.count ?? 0),
      0,
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            data-testid="forms-title"
          >
            Forms
          </h1>
          <p className="text-sm text-muted-foreground">
            Build, publish, and collect structured data for compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/forms/templates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
            data-testid="browse-templates-btn"
          >
            <ClipboardList className="h-4 w-4" />
            Templates
          </Link>
          <Link
            href="/app/forms/builder/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            data-testid="create-form-btn"
          >
            <Plus className="h-4 w-4" />
            New Form
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Forms</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.draft}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1" action="/app/forms" method="GET">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search forms..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="forms-search"
          />
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
        </form>
        <div className="flex gap-2">
          {['', 'draft', 'published', 'archived'].map((s) => (
            <Link
              key={s}
              href={`/app/forms${s ? `?status=${s}` : ''}${q ? `${s ? '&' : '?'}q=${q}` : ''}`}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-accent'
              }`}
              data-testid={`filter-${s || 'all'}`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          ))}
        </div>
      </div>

      {/* Forms Table */}
      {forms.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">No forms yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first form to start collecting structured compliance
            data.
          </p>
          <Link
            href="/app/forms/builder/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Form
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full" data-testid="forms-table">
            <thead>
              <tr className="bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Form</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">
                  Submissions
                </th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">
                  Version
                </th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">
                  Updated
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forms.map((form) => {
                const subCount =
                  (form.submission_count as any)?.[0]?.count ?? 0;
                return (
                  <tr
                    key={form.id}
                    className="hover:bg-muted/30 transition-colors"
                    data-testid={`form-row-${form.id}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/forms/builder/${form.id}`}
                        className="font-medium hover:underline"
                      >
                        {form.title}
                      </Link>
                      {form.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                          {form.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                          form.status,
                        )}`}
                      >
                        {form.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                      {subCount}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                      v{form.version ?? 1}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(form.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {form.status === 'published' && (
                          <Link
                            href={`/app/forms/${form.id}/submissions`}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                            title="View submissions"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/app/forms/builder/${form.id}`}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                          title="Edit form"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
