'use client';

import { useState } from 'react';
import { Search, Download, CheckCircle2, XCircle, Shield, Filter, Eye } from 'lucide-react';

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
}

export function AuditTrailViewer({ entries, total, onFilter }: {
  entries: AuditEntry[];
  total: number;
  onFilter?: (filters: Record<string, string>) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{total} total entries</p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Action</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Resource</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">IP</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Hash</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Time</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <>
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="p-3 text-xs">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {entry.resource_type}
                    {entry.resource_id && <span className="font-mono ml-1">{entry.resource_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground font-mono">{entry.ip_address || '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground font-mono">
                    {entry.entry_hash ? `${entry.entry_hash.slice(0, 12)}…` : '—'}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
                {expanded === entry.id && (
                  <tr key={`${entry.id}-details`}>
                    <td colSpan={6} className="p-3 bg-muted/10">
                      <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">No audit entries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ChainIntegrity {
  valid: boolean;
  totalChecked: number;
  brokenAt?: number;
  lastVerified?: string;
}

export function ChainIntegrityBadge({ integrity }: { integrity: ChainIntegrity }) {
  return (
    <div className={`rounded-lg border-2 p-4 ${
      integrity.valid ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
    }`}>
      <div className="flex items-center gap-3">
        {integrity.valid ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        ) : (
          <XCircle className="h-6 w-6 text-red-600" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {integrity.valid ? 'Chain Integrity Verified' : 'Chain Integrity Broken'}
          </p>
          <p className="text-xs text-muted-foreground">
            {integrity.totalChecked} entries checked
            {integrity.brokenAt !== undefined && ` · Broken at entry #${integrity.brokenAt}`}
            {integrity.lastVerified && ` · Last verified ${new Date(integrity.lastVerified).toLocaleDateString()}`}
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

export function AuditExportPanel({ jobs, onRequest }: { jobs: ExportJob[]; onRequest?: (dateFrom: string, dateTo: string) => void }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="space-y-4">
      {onRequest && (
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded bg-background text-foreground" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded bg-background text-foreground" />
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
        {jobs.map(job => (
          <div key={job.id} className="flex items-center justify-between p-3 rounded border border-border">
            <div>
              <p className="text-xs text-foreground">{job.date_from} → {job.date_to}</p>
              <p className="text-[10px] text-muted-foreground">
                {job.status} {job.file_size_bytes && `· ${(job.file_size_bytes / 1024).toFixed(1)} KB`}
              </p>
            </div>
            {job.file_url && job.status === 'completed' && (
              <a href={job.file_url} download className="text-xs text-primary hover:underline flex items-center gap-1">
                <Download className="h-3 w-3" /> Download
              </a>
            )}
            {job.status === 'pending' && <span className="text-xs text-yellow-600">Queued</span>}
            {job.status === 'processing' && <span className="text-xs text-blue-600">Processing…</span>}
            {job.status === 'failed' && <span className="text-xs text-red-600">Failed</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
