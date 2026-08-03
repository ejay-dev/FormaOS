/**
 * Forms Management Page
 * List, create, and manage forms with status filtering
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FileText, Eye } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { buildOrSearch } from '@/lib/utils/postgrest-search';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';
import {
  RecordCard,
  RecordList,
} from '@/components/mobile/record-card';
import {
  StatusBadge,
  documentStatus,
} from '@/components/compliance/StatusBadge';

const FORMS_PAGE_SIZE = 50;

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function FormsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? '').trim();
  const statusFilter = (params.status ?? '').trim();
  const pageParam = parseInt((params.page ?? '1').trim(), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const offset = (page - 1) * FORMS_PAGE_SIZE;

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
      .order('created_at', { ascending: false })
      .range(offset, offset + FORMS_PAGE_SIZE - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const orPredicate = buildOrSearch(['title', 'description'], q);
    if (orPredicate) {
      query = query.or(orPredicate);
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

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Total', value: stats.total, sub: 'forms' },
    {
      label: 'Published',
      value: stats.published,
      sub: stats.published > 0 ? 'live' : 'none yet',
      tone: 'success',
    },
    {
      label: 'Drafts',
      value: stats.draft,
      sub: stats.draft > 0 ? 'in progress' : 'all published',
      tone: stats.draft > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Submissions',
      value: stats.totalSubmissions,
      sub: 'collected',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHero
        eyebrow="Governance · Forms"
        title="Forms"
        titleTestId="forms-title"
        subtitle="Build, publish, and collect structured data for compliance."
        metrics={heroMetrics}
        actions={
          <Link
            href="/app/forms/builder/new"
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
            data-testid="create-form-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            New Form
          </Link>
        }
      />

      <div className="page-content space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <form className="relative flex-1" action="/app/forms" method="GET">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search forms..."
              aria-label="Search forms"
              className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-border bg-background"
              data-testid="forms-search"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {statusFilter && (
              <input type="hidden" name="status" value={statusFilter} />
            )}
          </form>
          <div className="flex gap-1">
            {['', 'draft', 'published', 'archived'].map((s) => (
              <Link
                key={s}
                href={`/app/forms${s ? `?status=${s}` : ''}${q ? `${s ? '&' : '?'}q=${q}` : ''}`}
                className={`h-9 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 justify-center px-3 rounded-md text-xs font-medium transition-colors inline-flex items-center ${
                  statusFilter === s
                    ? 'bg-accent/50 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/30'
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
          <div className="text-center py-8 bg-card rounded-lg border border-border">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-semibold">No forms yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first form to start collecting structured compliance
              data.
            </p>
            <Link
              href="/app/forms/builder/new"
              className="min-h-[44px] md:min-h-0 mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Form
            </Link>
          </div>
        ) : (
          <>
          {/* Mobile cards */}
          <div className="md:hidden">
            <RecordList>
              {forms.map((form) => {
                const subCount =
                  (form.submission_count as { count?: number }[] | undefined)?.[0]
                    ?.count ?? 0;
                return (
                  <RecordCard
                    key={form.id}
                    href={`/app/forms/builder/${form.id}`}
                    title={form.title}
                    subtitle={form.description ?? undefined}
                    status={<StatusBadge {...documentStatus(form.status)} />}
                    meta={[
                      { label: 'Submissions', value: String(subCount) },
                      { label: 'Version', value: `v${form.version ?? 1}` },
                      { label: 'Updated', value: formatDate(form.updated_at) },
                    ]}
                  />
                );
              })}
            </RecordList>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[480px] w-full" data-testid="forms-table">
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
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
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
                          <StatusBadge {...documentStatus(form.status)} />
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
                                className="min-h-[44px] md:min-h-0 p-1.5 rounded-lg hover:bg-accent transition-colors"
                                title="View submissions"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            )}
                            <Link
                              href={`/app/forms/builder/${form.id}`}
                              className="min-h-[44px] md:min-h-0 p-1.5 rounded-lg hover:bg-accent transition-colors"
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
          </div>
          </>
        )}
      </div>
    </div>
  );
}
