import { redirect } from 'next/navigation';
import Link from 'next/link';
import { sanitizeSnippet } from '@/lib/security/sanitize-html';
import { fetchSystemState } from '@/lib/system-state/server';
import { search } from '@/lib/search/search-engine';
import { trackSearch } from '@/lib/search/search-engine';
import {
  Search,
  FileText,
  Shield,
  AlertTriangle,
  Users,
  ClipboardCheck,
  File,
  BookOpen,
  Heart,
  BarChart3,
  Award,
} from 'lucide-react';

export const metadata = { title: 'Search | FormaOS' };

const ENTITY_ICONS: Record<string, typeof FileText> = {
  task: ClipboardCheck,
  evidence: File,
  control: Shield,
  policy: BookOpen,
  form: FileText,
  participant: Users,
  incident: AlertTriangle,
  care_plan: Heart,
  report: BarChart3,
  certificate: Award,
  member: Users,
};

const ENTITY_ROUTES: Record<string, string> = {
  task: '/app/tasks',
  evidence: '/app/evidence',
  control: '/app/controls',
  policy: '/app/policies',
  form: '/app/forms',
  participant: '/app/participants',
  incident: '/app/incidents',
  care_plan: '/app/care-plans',
  report: '/app/reports',
  certificate: '/app/certificates',
  member: '/app/team',
};

const ENTITY_TYPES = [
  'task',
  'evidence',
  'control',
  'policy',
  'form',
  'participant',
  'incident',
  'care_plan',
  'report',
  'certificate',
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const sp = await searchParams;
  const q = sp.q ?? '';
  const type = sp.type ?? null;
  const from = sp.from ?? undefined;
  const to = sp.to ?? undefined;

  let results: Array<{
    entity_type: string;
    entity_id: string;
    title: string;
    snippet: string;
    rank: number;
    metadata: Record<string, unknown>;
  }> = [];
  let total = 0;

  if (q) {
    const searchResult = await search(state.organization.id, q, {
      entityTypes: type ? [type] : undefined,
      from,
      to,
      limit: 50,
    });
    results = searchResult.results;
    total = searchResult.total;

    await trackSearch(state.organization.id, state.user.id, q, total);
  }

  // Compute facets
  const facets: Record<string, number> = {};
  for (const r of results) {
    facets[r.entity_type] = (facets[r.entity_type] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex gap-6">
        {/* Sidebar: facets */}
        <div className="hidden w-48 shrink-0 space-y-1 lg:block">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Filter by type
          </h3>
          <Link
            href={`/app/search?q=${encodeURIComponent(q)}`}
            className={`block rounded px-2 py-1.5 text-sm ${!type ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            All ({total})
          </Link>
          {ENTITY_TYPES.map((t) => {
            const count = facets[t] ?? 0;
            if (count === 0 && !type) return null;
            const Icon = ENTITY_ICONS[t] ?? FileText;
            return (
              <Link
                key={t}
                href={`/app/search?q=${encodeURIComponent(q)}&type=${t}`}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${t === type ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1">{t.replace('_', ' ')}</span>
                <span className="text-xs">{count}</span>
              </Link>
            );
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Search bar */}
          <form method="get" className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search across your workspace…"
                aria-label="Search workspace"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {type && <input type="hidden" name="type" value={type} />}
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Search
            </button>
          </form>

          {/* Results header */}
          {q && (
            <p className="text-sm text-muted-foreground">
              {total} result{total !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
              {type && <span> in {type.replace('_', ' ')}s</span>}
            </p>
          )}

          {/* Results */}
          <div className="space-y-2">
            {results.map((r) => {
              const Icon = ENTITY_ICONS[r.entity_type] ?? FileText;
              return (
                <Link
                  key={`${r.entity_type}-${r.entity_id}`}
                  href={`${ENTITY_ROUTES[r.entity_type] ?? '/app'}/${r.entity_id}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:bg-muted/30"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.title}</p>
                    {r.snippet && (
                      <p
                        className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeSnippet(r.snippet),
                        }}
                      />
                    )}
                    <div className="mt-2 flex gap-2">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {r.entity_type.replace('_', ' ')}
                      </span>
                      {r.metadata?.status ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          {String(r.metadata.status)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {q && results.length === 0 && (
            <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No results found for &ldquo;{q}&rdquo;
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try different keywords, check spelling, or remove filters
              </p>
            </div>
          )}

          {!q && (
            <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Enter a search term to find tasks, evidence, controls, and more
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
