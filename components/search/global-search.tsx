'use client';

import { sanitizeSnippet } from '@/lib/security/sanitize-html';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
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
  Clock,
  ArrowRight,
  Bookmark,
} from 'lucide-react';

type SearchResult = {
  entity_type: string;
  entity_id: string;
  title: string;
  snippet: string;
  rank: number;
  metadata: Record<string, unknown>;
};

type RecentItem = {
  entity_type: string;
  entity_id: string;
  entity_title: string;
  accessed_at: string;
};

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

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      fetchRecent();
    } else {
      setQuery('');
      setResults([]);
      setSelectedType(null);
      setSelectedIndex(0);
    }
  }, [open]);

  const fetchRecent = async () => {
    try {
      const res = await fetch('/api/v1/search/recent?limit=8');
      if (res.ok) {
        const data = await res.json();
        setRecentItems(data.recentItems ?? []);
      }
    } catch {
      /* ignore */
    }
  };

  const doSearch = useCallback(async (q: string, type: string | null) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (type) params.set('types', type);
      const res = await fetch(`/api/v1/search/unified?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
        setSelectedIndex(0);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value, selectedType), 200);
  };

  const onTypeFilter = (type: string | null) => {
    setSelectedType(type);
    doSearch(query, type);
  };

  const navigateTo = (entityType: string, entityId: string) => {
    const base = ENTITY_ROUTES[entityType] ?? '/app';
    router.push(`${base}/${entityId}`);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? results : recentItems;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items.length > 0) {
      e.preventDefault();
      const item = items[selectedIndex];
      if (item) {
        navigateTo(item.entity_type, item.entity_id);
      }
    }
  };

  // Group results by entity type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.entity_type] ??= []).push(r);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      data-testid="global-search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search everything… (tasks, evidence, policies, people)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            data-testid="global-search-input"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        {/* Type filters */}
        {query && (
          <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2">
            <button
              onClick={() => onTypeFilter(null)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${!selectedType ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              All
            </button>
            {ENTITY_TYPES.map((t) => {
              const Icon = ENTITY_ICONS[t] ?? FileText;
              const count = grouped[t]?.length ?? 0;
              return (
                <button
                  key={t}
                  onClick={() => onTypeFilter(t === selectedType ? null : t)}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs ${t === selectedType ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <Icon className="h-3 w-3" />
                  {t.replace('_', ' ')}
                  {count > 0 && (
                    <span className="ml-0.5 font-medium">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No results for "{query}"
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different search term or check the spelling
              </p>
              <button
                onClick={() => {
                  router.push(`/app/search?q=${encodeURIComponent(query)}`);
                  setOpen(false);
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Advanced search <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {!loading && query && results.length > 0 && (
            <div className="py-2">
              {results.map((r, i) => {
                const Icon = ENTITY_ICONS[r.entity_type] ?? FileText;
                return (
                  <button
                    key={`${r.entity_type}-${r.entity_id}`}
                    onClick={() => navigateTo(r.entity_type, r.entity_id)}
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-muted/50 ${i === selectedIndex ? 'bg-muted/50' : ''}`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      {r.snippet && (
                        <p
                          className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeSnippet(r.snippet),
                          }}
                        />
                      )}
                    </div>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {r.entity_type.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent items (shown when no query) */}
          {!loading && !query && recentItems.length > 0 && (
            <div className="py-2">
              <div className="flex items-center gap-2 px-4 py-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Recent
                </span>
              </div>
              {recentItems.map((item, i) => {
                const Icon = ENTITY_ICONS[item.entity_type] ?? FileText;
                return (
                  <button
                    key={`${item.entity_type}-${item.entity_id}`}
                    onClick={() => navigateTo(item.entity_type, item.entity_id)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 ${i === selectedIndex ? 'bg-muted/50' : ''}`}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">
                      {item.entity_title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.entity_type.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !query && recentItems.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Start typing to search across your workspace
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <div className="flex gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
          <button
            onClick={() => {
              router.push(`/app/search?q=${encodeURIComponent(query)}`);
              setOpen(false);
            }}
            className="flex items-center gap-1 hover:text-foreground"
          >
            Full search <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact recent items widget for dashboard sidebar */
export function RecentItemsWidget() {
  const router = useRouter();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    fetch('/api/v1/search/recent?limit=5')
      .then((r) => (r.ok ? r.json() : { recentItems: [] }))
      .then((data) => setItems(data.recentItems ?? []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 pb-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">
          Recently Viewed
        </span>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = ENTITY_ICONS[item.entity_type] ?? FileText;
          return (
            <button
              key={`${item.entity_type}-${item.entity_id}`}
              onClick={() =>
                router.push(
                  `${ENTITY_ROUTES[item.entity_type] ?? '/app'}/${item.entity_id}`,
                )
              }
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-muted/50"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-xs">
                {item.entity_title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
