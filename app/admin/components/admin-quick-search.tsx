'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

type Scope = 'orgs' | 'users';

export function AdminQuickSearch() {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>('orgs');
  const [query, setQuery] = useState('');

  const targetHref = useMemo(() => {
    const q = query.trim();
    if (!q) return scope === 'users' ? '/admin/users' : '/admin/orgs';
    const params = new URLSearchParams();
    params.set('query', q);
    return scope === 'users'
      ? `/admin/users?${params.toString()}`
      : `/admin/orgs?${params.toString()}`;
  }, [query, scope]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(targetHref);
      }}
      className="hidden lg:flex items-center gap-2"
      aria-label="Admin quick search"
    >
      <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orgs, owners, user emails..."
          className="ml-2 w-[320px] bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
          aria-label="Search query"
        />
      </div>
      <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        <button
          type="button"
          onClick={() => setScope('orgs')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            scope === 'orgs'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-pressed={scope === 'orgs'}
        >
          Orgs
        </button>
        <button
          type="button"
          onClick={() => setScope('users')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            scope === 'users'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-pressed={scope === 'users'}
        >
          Users
        </button>
      </div>
    </form>
  );
}

