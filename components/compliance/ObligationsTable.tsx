'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Paperclip, ArrowUpDown, Download, Users, Filter } from 'lucide-react';
import Button from '@/components/ui/button';
import { OwnerChip } from '@/components/compliance/OwnerChip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EvidenceDrawer } from '@/components/compliance/EvidenceDrawer';
import type { ObligationStatus } from '@/lib/stores/compliance';
import { ragFromStatus, ragBadgeClass } from '@/lib/stores/compliance';

interface ObligationRow {
  id: string;
  title: string;
  framework: string;
  frameworkCode: string;
  owner: { id: string; name: string; avatarUrl?: string; team?: string } | null;
  dueDate: string;
  status: ObligationStatus;
  evidenceCount: number;
}

const STATUS_LABELS: Record<ObligationStatus, string> = {
  overdue: 'Overdue',
  due_soon: 'Due Soon',
  on_track: 'On Track',
  completed: 'Completed',
  not_started: 'Not Started',
};

const STATUS_SORT_ORDER: Record<ObligationStatus, number> = {
  overdue: 0,
  due_soon: 1,
  on_track: 2,
  not_started: 3,
  completed: 4,
};

function StatusBadge({ status }: { status: ObligationStatus }) {
  const rag = ragFromStatus(status);
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${ragBadgeClass(rag)}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
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
  onFrameworkChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

function FilterBar({
  frameworks,
  selectedFramework,
  selectedStatus,
  onFrameworkChange,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={selectedFramework}
        onChange={(e) => onFrameworkChange(e.target.value)}
        className="rounded-md border border-glass-border bg-glass-subtle px-2 py-1 text-xs text-foreground"
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
        className="rounded-md border border-glass-border bg-glass-subtle px-2 py-1 text-xs text-foreground"
      >
        <option value="">All Statuses</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
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

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/v1/compliance/obligations');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (mounted) setData(json.obligations ?? []);
      } catch {
        // empty
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const frameworks = useMemo(
    () => [...new Set(data.map((d) => d.framework))].sort(),
    [data],
  );

  const filteredData = useMemo(() => {
    let result = data;
    if (frameworkFilter)
      result = result.filter((d) => d.framework === frameworkFilter);
    if (statusFilter) result = result.filter((d) => d.status === statusFilter);
    return result;
  }, [data, frameworkFilter, statusFilter]);

  const columns: ColumnDef<ObligationRow>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-3.5 w-3.5 rounded border-glass-border"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-3.5 w-3.5 rounded border-glass-border"
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
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
        size: 110,
        sortingFn: (a, b) => {
          return (
            STATUS_SORT_ORDER[a.original.status] -
            STATUS_SORT_ORDER[b.original.status]
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

  return (
    <>
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <FilterBar
            frameworks={frameworks}
            selectedFramework={frameworkFilter}
            selectedStatus={statusFilter}
            onFrameworkChange={setFrameworkFilter}
            onStatusChange={setStatusFilter}
          />
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedCount} selected
              </span>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Users className="h-3 w-3 mr-1" /> Reassign
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
            </div>
          )}
        </div>

        {/* Compact table */}
        <div className="rounded-lg border border-glass-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="border-b border-glass-border bg-glass-subtle"
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
                      No obligations found. Add your first framework to get
                      started.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-glass-border/50 transition-colors hover:bg-glass-subtle h-8"
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
        onOpenChange={(open) =>
          setEvidenceDrawer((prev) => ({ ...prev, open }))
        }
        obligationId={evidenceDrawer.id}
        obligationTitle={evidenceDrawer.title}
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
