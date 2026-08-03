'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AuditTrailViewer,
  AuditExportPanel,
  type AuditEntry,
  type ExportJob,
} from '@/components/audit/audit-trail-enhanced';
import { createAuditExport } from './actions';

export function FilterableAuditTrail({
  entries,
  total,
}: {
  entries: AuditEntry[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <AuditTrailViewer
      entries={entries}
      total={total}
      onFilter={(filters) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
          if (value) params.set(key, value);
        }
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    />
  );
}

export function RequestableAuditExports({ jobs }: { jobs: ExportJob[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <AuditExportPanel
        jobs={jobs}
        onRequest={(dateFrom, dateTo) => {
          start(async () => {
            const result = await createAuditExport(dateFrom, dateTo);
            if ('error' in result) {
              setFailed(true);
              setMessage(result.error);
              return;
            }
            setFailed(false);
            setMessage('Export queued. It appears below once it is ready.');
            router.refresh();
          });
        }}
      />

      {pending ? (
        <p className="text-xs text-muted-foreground">Queueing export…</p>
      ) : null}

      {message ? (
        <p
          className={`text-xs ${failed ? 'text-destructive' : 'text-muted-foreground'}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      {jobs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
          No exports yet. Choose a date range above to generate one.
        </p>
      ) : null}
    </div>
  );
}
