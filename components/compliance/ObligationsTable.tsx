'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { Paperclip, ArrowUpDown, Download, Filter } from 'lucide-react';
import Button from '@/components/ui/button';
import { OwnerChip } from '@/components/compliance/OwnerChip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EvidenceDrawer } from '@/components/compliance/EvidenceDrawer';
import {
  StatusBadge,
  obligationStatus,
  severityStatus,
} from '@/components/compliance/StatusBadge';
import type { ObligationStatus } from '@/lib/stores/compliance';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface ObligationRow {
  id: string;
  title: string;
  framework: string;
  frameworkCode: string;
  owner: { id: string; name: string; avatarUrl?: string; team?: string } | null;
  dueDate: string;
  status: ObligationStatus;
  evidenceCount: number;
  riskScore?: RiskLevel;
}

const STATUS_LABELS: Record<ObligationStatus, string> = {
  overdue: obligationStatus('overdue').label,
  due_soon: obligationStatus('due_soon').label,
  on_track: obligationStatus('on_track').label,
  completed: obligationStatus('completed').label,
  not_started: obligationStatus('not_started').label,
};

const STATUS_SORT_ORDER: Record<ObligationStatus, number> = {
  overdue: 0,
  due_soon: 1,
  on_track: 2,
  not_started: 3,
  completed: 4,
};

const RISK_SORT_ORDER: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const RISK_LABELS: Record<RiskLevel, string> = {
  critical: severityStatus('critical').label,
  high: severityStatus('high').label,
  medium: severityStatus('medium').label,
  low: severityStatus('low').label,
};

function computeRiskScore(row: ObligationRow): RiskLevel {
  if (row.status === 'completed') return 'low';

  let score = 0;

  // Status weight
  if (row.status === 'overdue') score += 40;
  else if (row.status === 'due_soon') score += 20;
  else if (row.status === 'not_started') score += 15;

  // Days overdue / until due
  const now = Date.now();
  const due = new Date(row.dueDate).getTime();
  const daysUntilDue = (due - now) / (1000 * 60 * 60 * 24);
  if (daysUntilDue < -30) score += 30;
  else if (daysUntilDue < -7) score += 20;
  else if (daysUntilDue < 0) score += 10;
  else if (daysUntilDue < 7) score += 5;

  // Evidence gap
  if (row.evidenceCount === 0) score += 20;
  else if (row.evidenceCount < 2) score += 10;

  // No owner assigned
  if (!row.owner) score += 10;

  if (score >= 60) return 'critical';
  if (score >= 35) return 'high';
  if (score >= 15) return 'medium';
  return 'low';
}

const CSV_COLUMNS = [
  'Obligation',
  'Framework',
  'Owner',
  'Due date',
  'Status',
  'Risk',
  'Evidence',
] as const;

function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportRowsToCsv(rows: ObligationRow[]) {
  if (rows.length === 0) return;

  const lines = [
    CSV_COLUMNS.join(','),
    ...rows.map((row) =>
      [
        row.title,
        row.frameworkCode,
        row.owner?.name ?? 'Unassigned',
        row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '',
        obligationStatus(row.status).label,
        severityStatus(row.riskScore).label,
        row.evidenceCount,
      ]
        .map(csvCell)
        .join(','),
    ),
  ];

  const url = URL.createObjectURL(
    new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `obligations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function OwnerCell({ owner }: { owner: ObligationRow['owner'] }) {
  return (
    <OwnerChip
      name={owner?.name ?? null}
      avatarUrl={owner?.avatarUrl}
      team={owner?.team}
      size="sm"
    />
  );
}

interface FilterBarProps {
  frameworks: string[];
  selectedFramework: string;
  selectedStatus: string;
  selectedRisk: string;
  onFrameworkChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onRiskChange: (v: string) => void;
}

function FilterBar({
  frameworks,
  selectedFramework,
  selectedStatus,
  selectedRisk,
  onFrameworkChange,
  onStatusChange,
  onRiskChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={selectedFramework}
        onChange={(e) => onFrameworkChange(e.target.value)}
        className="rounded-md border border-border bg-surface-1 px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All Frameworks</option>
        {frameworks.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-md border border-border bg-surface-1 px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All Statuses</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select
        value={selectedRisk}
        onChange={(e) => onRiskChange(e.target.value)}
        className="rounded-md border border-border bg-surface-1 px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All Risk Levels</option>
        {Object.entries(RISK_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function ObligationsTableInner() {
  const [data, setData] = useState<ObligationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'status', desc: false },
    { id: 'dueDate', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [evidenceDrawer, setEvidenceDrawer] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: '', title: '' });
  const [frameworkFilter, setFrameworkFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/compliance/obligations');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json.obligations ?? []);
      setLoadFailed(false);
    } catch {
      // A failed fetch must never be reported as "you have no obligations".
      setLoadFailed(true);
    }
  }, []);

  const retry = useCallback(async () => {
    setIsLoading(true);
    await reload();
    setIsLoading(false);
  }, [reload]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await reload();
      if (mounted) setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [reload]);

  const frameworks = useMemo(
    () => [...new Set(data.map((d) => d.framework))].sort(),
    [data],
  );

  const scoredData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        riskScore: d.riskScore ?? computeRiskScore(d),
      })),
    [data],
  );

  const filteredData = useMemo(() => {
    let result = scoredData;
    if (frameworkFilter)
      result = result.filter((d) => d.framework === frameworkFilter);
    if (statusFilter) result = result.filter((d) => d.status === statusFilter);
    if (riskFilter) result = result.filter((d) => d.riskScore === riskFilter);
    return result;
  }, [scoredData, frameworkFilter, statusFilter, riskFilter]);

  const columns: ColumnDef<ObligationRow>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-3.5 w-3.5 rounded border-border"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-3.5 w-3.5 rounded border-border"
          />
        ),
        size: 32,
        enableSorting: false,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1"
          >
            Obligation <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">
            {row.getValue('title')}
          </span>
        ),
      },
      {
        accessorKey: 'frameworkCode',
        header: 'Framework',
        cell: ({ row }) => (
          <Badge variant="glass" className="text-[10px] font-mono">
            {row.getValue('frameworkCode')}
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'owner',
        header: 'Owner',
        cell: ({ row }) => <OwnerCell owner={row.original.owner} />,
        size: 160,
        enableSorting: false,
      },
      {
        accessorKey: 'dueDate',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1"
          >
            Due Date <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {new Date(row.getValue('dueDate')).toLocaleDateString()}
          </span>
        ),
        size: 100,
        sortingFn: (a, b) => {
          return (
            new Date(a.original.dueDate).getTime() -
            new Date(b.original.dueDate).getTime()
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1"
          >
            Status <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <StatusBadge {...obligationStatus(row.getValue('status'))} />
        ),
        size: 110,
        sortingFn: (a, b) => {
          return (
            STATUS_SORT_ORDER[a.original.status] -
            STATUS_SORT_ORDER[b.original.status]
          );
        },
      },
      {
        accessorKey: 'riskScore',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1"
          >
            Risk <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <StatusBadge
            {...severityStatus(row.getValue('riskScore') as RiskLevel)}
          />
        ),
        size: 90,
        sortingFn: (a, b) => {
          return (
            RISK_SORT_ORDER[a.original.riskScore ?? 'low'] -
            RISK_SORT_ORDER[b.original.riskScore ?? 'low']
          );
        },
      },
      {
        accessorKey: 'evidenceCount',
        header: 'Evidence',
        cell: ({ row }) => {
          const count = row.original.evidenceCount;
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEvidenceDrawer({
                  open: true,
                  id: row.original.id,
                  title: row.original.title,
                });
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Paperclip className="h-3 w-3" />
              <span className="font-mono">{count}</span>
            </button>
          );
        },
        size: 80,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const hasActiveFilter = Boolean(
    frameworkFilter || statusFilter || riskFilter,
  );
  const emptyMessage = hasActiveFilter
    ? 'No obligations match these filters.'
    : 'No obligations yet. Enable a framework to populate the register.';

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (loadFailed && data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Couldn&apos;t load your obligations
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          The register is still there — the connection failed. Try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 h-7 text-xs"
          onClick={() => void retry()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <FilterBar
            frameworks={frameworks}
            selectedFramework={frameworkFilter}
            selectedStatus={statusFilter}
            selectedRisk={riskFilter}
            onFrameworkChange={setFrameworkFilter}
            onStatusChange={setStatusFilter}
            onRiskChange={setRiskFilter}
          />
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedCount} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() =>
                  exportRowsToCsv(
                    table.getSelectedRowModel().rows.map((r) => r.original),
                  )
                }
              >
                <Download className="h-3 w-3 mr-1" /> Export CSV
              </Button>
            </div>
          )}
        </div>

        {/* Mobile triage cards — single record at a time, tap to open
            evidence drawer for that obligation. */}
        <div className="md:hidden space-y-2">
          {filteredData.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredData.slice(0, 50).map((row) => {
              const due = row.dueDate
                ? new Date(row.dueDate).toLocaleDateString()
                : '—';
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    setEvidenceDrawer({
                      open: true,
                      id: row.id,
                      title: row.title,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-left min-h-[64px] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground leading-snug truncate">
                        {row.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground leading-snug">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {row.frameworkCode}
                        </Badge>
                        <span className="truncate">{row.framework}</span>
                      </div>
                    </div>
                    <StatusBadge {...obligationStatus(row.status)} />
                  </div>
                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <dt className="uppercase tracking-wider text-muted-foreground/80">
                        Due
                      </dt>
                      <dd className="text-foreground/85 font-medium">{due}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="uppercase tracking-wider text-muted-foreground/80">
                        Evidence
                      </dt>
                      <dd className="text-foreground/85 font-medium inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {row.evidenceCount}
                      </dd>
                    </div>
                    {row.owner && (
                      <div className="flex items-center gap-1.5">
                        <dt className="uppercase tracking-wider text-muted-foreground/80">
                          Owner
                        </dt>
                        <dd className="text-foreground/85 font-medium truncate max-w-[140px]">
                          {row.owner.name}
                        </dd>
                      </div>
                    )}
                    {row.riskScore && (
                      <div className="flex items-center gap-1.5">
                        <dt className="uppercase tracking-wider text-muted-foreground/80">
                          Risk
                        </dt>
                        <dd className="font-medium text-foreground/85">
                          {severityStatus(row.riskScore).label}
                        </dd>
                      </div>
                    )}
                  </dl>
                </button>
              );
            })
          )}
          {filteredData.length > 50 && (
            <div className="text-center text-[11px] text-muted-foreground py-2">
              Showing 50 of {filteredData.length}. Open on a desktop to see
              the full table with sorting and pagination.
            </div>
          )}
        </div>

        {/* Compact table — desktop only */}
        <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="border-b border-border bg-surface-1"
                  >
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="h-8 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 transition-colors hover:bg-surface-1 h-8"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-1.5">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredData.length} obligation
            {filteredData.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <EvidenceDrawer
        open={evidenceDrawer.open}
        onOpenChange={(open) => {
          setEvidenceDrawer((prev) => ({ ...prev, open }));
          // When the drawer closes, refresh counts authoritatively so the
          // register reflects whatever the user just attached.
          if (!open) void reload();
        }}
        obligationId={evidenceDrawer.id}
        obligationTitle={evidenceDrawer.title}
        onEvidenceChanged={(count) => {
          // Optimistically reflect the new count in the row; reload() on
          // close will reconcile with the server-side aggregate.
          setData((rows) =>
            rows.map((r) =>
              r.id === evidenceDrawer.id ? { ...r, evidenceCount: count } : r,
            ),
          );
        }}
      />
    </>
  );
}

/**
 * Obligations Table — dense TanStack Table for compliance teams.
 * Default sort: overdue first, then due soonest.
 * RAG badges, inline status, owner avatars, evidence drawer.
 */
export function ObligationsTable() {
  return (
    <ErrorBoundary name="ObligationsTable" level="feature">
      <ObligationsTableInner />
    </ErrorBoundary>
  );
}
