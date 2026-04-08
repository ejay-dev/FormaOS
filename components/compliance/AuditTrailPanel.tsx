'use client';

import { useState, useEffect } from 'react';
import { Lock, User, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityName?: string;
  actor: { name: string; avatarUrl?: string; email?: string };
  timestamp: string;
  locked: boolean;
  details?: string;
}

interface AuditTrailPanelProps {
  entityId: string;
  entityType: string;
  maxEntries?: number;
}

function AuditTrailInner({
  entityId,
  entityType,
  maxEntries = 20,
}: AuditTrailPanelProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(
          `/api/v1/audit-trail?entityId=${encodeURIComponent(entityId)}&entityType=${encodeURIComponent(entityType)}&limit=${maxEntries}`,
        );
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) setEntries(data.entries ?? []);
      } catch {
        // fail silently
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [entityId, entityType, maxEntries]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <History className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          No activity recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          className="relative flex items-start gap-3 py-2 px-1"
        >
          {/* Timeline line */}
          {idx < entries.length - 1 && (
            <div className="absolute left-[13px] top-9 bottom-0 w-px bg-glass-border" />
          )}

          {/* Avatar */}
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-glass-subtle border border-glass-border shrink-0 z-10">
            {entry.actor.avatarUrl ? (
              <img
                src={entry.actor.avatarUrl}
                alt={entry.actor.name}
                className="h-7 w-7 rounded-full"
              />
            ) : (
              <User className="h-3 w-3 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-foreground leading-snug">
              <span className="font-semibold">{entry.actor.name}</span>{' '}
              <span className="text-muted-foreground">{entry.action}</span>
              {entry.entityName && (
                <span className="text-foreground/80">
                  {' '}
                  — {entry.entityName}
                </span>
              )}
            </p>
            {entry.details && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {entry.details}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono text-muted-foreground/60">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              {entry.locked && (
                <Lock
                  className="h-2.5 w-2.5 text-amber-400"
                  aria-label="Immutable audit entry"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Audit Trail Panel — shows immutable activity log on record detail pages.
 * Each entry: avatar + name + action + timestamp + lock icon.
 */
export function AuditTrailPanel(props: AuditTrailPanelProps) {
  return (
    <ErrorBoundary name="AuditTrailPanel" level="component">
      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-foreground/70" />
          <h3 className="text-sm font-semibold">Audit Trail</h3>
          <Lock
            className="h-3 w-3 text-amber-400 ml-auto"
            aria-label="Immutable record"
          />
        </div>
        <AuditTrailInner {...props} />
      </div>
    </ErrorBoundary>
  );
}
