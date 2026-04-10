'use client';

import { useState } from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  LogIn,
  FileOutput,
  ThumbsUp,
  ThumbsDown,
  Filter,
  X,
} from 'lucide-react';

interface AuditEntry {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  entry_hash?: string;
  /** Actor display name or email — may be injected server-side */
  actor_email?: string;
}

/** Maps raw action verbs to human-readable past-tense sentences */
function buildNarrative(entry: AuditEntry): string {
  const resource = entry.resource_type.replace(/_/g, ' ');
  const actor = entry.actor_email ? entry.actor_email.split('@')[0] : 'A user';

  const actionMap: Record<string, string> = {
    CREATE: `created a ${resource}`,
    UPDATE: `updated a ${resource}`,
    DELETE: `deleted a ${resource}`,
    APPROVE: `approved a ${resource}`,
    REJECT: `rejected a ${resource}`,
    VIEW: `viewed a ${resource}`,
    EXPORT: `exported ${resource} data`,
    LOGIN: `signed in`,
    LOGOUT: `signed out`,
  };

  const verb =
    actionMap[entry.action.toUpperCase()] ??
    `performed "${entry.action}" on ${resource}`;
  return `${actor} ${verb}`;
}

/** Picks a Lucide icon and color class for each action type */
function actionMeta(action: string): {
  icon: React.ElementType;
  color: string;
} {
  const a = action.toUpperCase();
  if (a === 'CREATE') return { icon: PlusCircle, color: 'text-emerald-400' };
  if (a === 'UPDATE') return { icon: Pencil, color: 'text-primary' };
  if (a === 'DELETE') return { icon: Trash2, color: 'text-rose-400' };
  if (a === 'APPROVE') return { icon: ThumbsUp, color: 'text-emerald-400' };
  if (a === 'REJECT') return { icon: ThumbsDown, color: 'text-rose-400' };
  if (a === 'VIEW') return { icon: Eye, color: 'text-muted-foreground' };
  if (a === 'EXPORT') return { icon: FileOutput, color: 'text-amber-400' };
  if (a === 'LOGIN' || a === 'LOGOUT')
    return { icon: LogIn, color: 'text-primary' };
  return { icon: Shield, color: 'text-muted-foreground' };
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Derives readable initials from an email address.
 *  "john.doe@example.com" → "JD"
 *  "ejaz@example.com"     → "EJ"  (single name: first 2 chars)
 */
function deriveInitials(email?: string): string {
  if (!email) return '??';
  const username = email.split('@')[0];
  const parts = username.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function ActorAvatar({ email }: { email?: string }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass-strong text-[10px] font-bold text-foreground/70">
      {deriveInitials(email)}
    </div>
  );
}

/** Groups entries by calendar day for timeline date headers */
function groupByDate(
  entries: AuditEntry[],
): Array<{ label: string; entries: AuditEntry[] }> {
  const map = new Map<string, AuditEntry[]>();
  for (const entry of entries) {
    const d = new Date(entry.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }
  return Array.from(map.entries()).map(([label, entries]) => ({
    label,
    entries,
  }));
}

const ACTION_OPTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'VIEW',
  'EXPORT',
];

export function AuditTrailViewer({
  entries,
  total,
  onFilter,
}: {
  entries: AuditEntry[];
  total: number;
  onFilter?: (filters: Record<string, string>) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilter = filterAction !== '' || filterResource !== '';

  function applyFilter() {
    if (!onFilter) return;
    const filters: Record<string, string> = {};
    if (filterAction) filters.action = filterAction;
    if (filterResource) filters.resource_type = filterResource;
    onFilter(filters);
  }

  function clearFilter() {
    setFilterAction('');
    setFilterResource('');
    if (onFilter) onFilter({});
  }

  const groups = groupByDate(entries);

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {total} recorded events
        </p>
        {onFilter && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              hasActiveFilter
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-glass-border bg-glass-subtle text-muted-foreground hover:bg-glass-strong'
            }`}
          >
            <Filter className="h-3 w-3" />
            {hasActiveFilter ? 'Filtered' : 'Filter'}
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && onFilter && (
        <div className="rounded-xl border border-glass-border bg-glass-subtle px-4 py-3 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="audit-filter-action"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Action
              </label>
              <select
                id="audit-filter-action"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="rounded-lg border border-glass-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">All actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="audit-filter-resource"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Resource type
              </label>
              <input
                id="audit-filter-resource"
                type="text"
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
                placeholder="e.g. policy, task…"
                className="rounded-lg border border-glass-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyFilter}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
            {hasActiveFilter && (
              <button
                onClick={clearFilter}
                className="flex items-center gap-1 rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-glass-strong transition-colors"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-glass-border bg-glass-subtle py-12 text-center">
          <Shield className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No audit entries found
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Date group header */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-glass-border" />
                <span className="text-[10px] text-muted-foreground/50">
                  {group.entries.length} event
                  {group.entries.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Narrative timeline for this group */}
              <div className="relative space-y-0">
                {/* Vertical rail */}
                <div
                  className="absolute left-[13px] top-3 bottom-3 w-px bg-glass-border"
                  aria-hidden
                />

                {group.entries.map((entry, idx) => {
                  const { icon: Icon, color } = actionMeta(entry.action);
                  const narrative = buildNarrative(entry);
                  const isExpanded = expanded === entry.id;
                  const isLast = idx === group.entries.length - 1;

                  return (
                    <div
                      key={entry.id}
                      className={`relative flex gap-4 ${isLast ? '' : 'pb-3'}`}
                    >
                      {/* Timeline node */}
                      <div className="relative z-10 mt-2 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-glass-border bg-background">
                        <Icon className={`h-3 w-3 ${color}`} />
                      </div>

                      {/* Event card */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() =>
                            setExpanded(isExpanded ? null : entry.id)
                          }
                          className="group w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3 rounded-xl border border-glass-border bg-glass-subtle px-3 py-2.5 transition-colors hover:bg-glass-strong">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <ActorAvatar email={entry.actor_email} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {narrative}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-muted-foreground/60">
                                    {entry.entry_hash
                                      ? entry.entry_hash.slice(0, 8)
                                      : '—'}
                                  </span>
                                  {entry.ip_address && (
                                    <span className="text-[10px] text-muted-foreground/50">
                                      {entry.ip_address}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {formatRelativeTime(entry.created_at)}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Expanded detail drawer */}
                        {isExpanded && (
                          <div className="mt-1 rounded-xl border border-glass-border bg-glass-subtle px-4 py-3">
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Event detail
                            </p>
                            <p className="mb-1 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground/70">
                                Time:
                              </span>{' '}
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                            {entry.resource_id && (
                              <p className="mb-1 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground/70">
                                  Resource ID:
                                </span>{' '}
                                <span className="font-mono">
                                  {entry.resource_id}
                                </span>
                              </p>
                            )}
                            {Object.keys(entry.details).length > 0 && (
                              <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-background/60 p-2 text-[10px] text-muted-foreground leading-relaxed">
                                {JSON.stringify(entry.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ChainIntegrity {
  valid: boolean;
  totalChecked: number;
  brokenAt?: number;
  lastVerified?: string;
}

export function ChainIntegrityBadge({
  integrity,
}: {
  integrity: ChainIntegrity;
}) {
  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        integrity.valid
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
      }`}
    >
      <div className="flex items-center gap-3">
        {integrity.valid ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        ) : (
          <XCircle className="h-6 w-6 text-red-600" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {integrity.valid
              ? 'Chain Integrity Verified'
              : 'Chain Integrity Broken'}
          </p>
          <p className="text-xs text-muted-foreground">
            {integrity.totalChecked} entries checked
            {integrity.brokenAt !== undefined &&
              ` · Broken at entry #${integrity.brokenAt}`}
            {integrity.lastVerified &&
              ` · Last verified ${new Date(integrity.lastVerified).toLocaleDateString()}`}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ExportJob {
  id: string;
  status: string;
  date_from: string;
  date_to: string;
  file_url?: string;
  file_size_bytes?: number;
  created_at: string;
  completed_at?: string;
}

export function AuditExportPanel({
  jobs,
  onRequest,
}: {
  jobs: ExportJob[];
  onRequest?: (dateFrom: string, dateTo: string) => void;
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="space-y-4">
      {onRequest && (
        <div className="flex gap-2 items-end">
          <div>
            <label
              htmlFor="audit-date-from"
              className="block text-xs text-muted-foreground mb-1"
            >
              From
            </label>
            <input
              id="audit-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>
          <div>
            <label
              htmlFor="audit-date-to"
              className="block text-xs text-muted-foreground mb-1"
            >
              To
            </label>
            <input
              id="audit-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>
          <button
            onClick={() => dateFrom && dateTo && onRequest(dateFrom, dateTo)}
            disabled={!dateFrom || !dateTo}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
          >
            <Download className="h-3 w-3" /> Export
          </button>
        </div>
      )}

      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-3 rounded border border-border"
          >
            <div>
              <p className="text-xs text-foreground">
                {job.date_from} → {job.date_to}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {job.status}{' '}
                {job.file_size_bytes &&
                  `· ${(job.file_size_bytes / 1024).toFixed(1)} KB`}
              </p>
            </div>
            {job.file_url && job.status === 'completed' && (
              <a
                href={job.file_url}
                download
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Download className="h-3 w-3" /> Download
              </a>
            )}
            {job.status === 'pending' && (
              <span className="text-xs text-yellow-600">Queued</span>
            )}
            {job.status === 'processing' && (
              <span className="text-xs text-blue-600">Processing…</span>
            )}
            {job.status === 'failed' && (
              <span className="text-xs text-red-600">Failed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
