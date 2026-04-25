'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, FileText, Lock, Paperclip, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * EntityEvidencePanel — inline counterpart to the obligation
 * EvidenceDrawer. Lets a detail page (incident, staff credential, …)
 * show its attached evidence and accept new uploads without opening a
 * sheet. Uses the same `/api/v1/evidence` endpoint with `entityId` +
 * `entityType` query params.
 */

interface EvidenceItem {
  id: string;
  type: 'file' | 'link' | 'note';
  title: string;
  submittedBy: { name: string };
  submittedAt: string;
  locked: boolean;
}

interface EntityEvidencePanelProps {
  entityId: string;
  entityType: 'incident' | 'staff_credential' | 'care_plan';
  /** Heading + helper text for the upload area. */
  heading?: string;
  emptyState?: string;
  /** Optional callback fired with the new total whenever an upload
   *  completes; lets the parent surface refresh sibling counts. */
  onCountChange?: (total: number) => void;
}

export function EntityEvidencePanel({
  entityId,
  entityType,
  heading = 'Attached Evidence',
  emptyState = 'No evidence attached yet.',
  onCountChange,
}: EntityEvidencePanelProps) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/evidence?entityId=${encodeURIComponent(entityId)}&entityType=${encodeURIComponent(entityType)}`,
      );
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const next: EvidenceItem[] = data.items ?? [];
      setItems(next);
      onCountChange?.(next.length);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, onCountChange]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/evidence?entityId=${encodeURIComponent(entityId)}&entityType=${encodeURIComponent(entityType)}`,
        );
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) {
          const next: EvidenceItem[] = data.items ?? [];
          setItems(next);
          onCountChange?.(next.length);
        }
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // We intentionally exclude `reload` from deps — initial load only.
  }, [entityId, entityType, onCountChange]);

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError(null);
      setIsUploading(true);
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        formData.append('entityId', entityId);
        formData.append('entityType', entityType);

        const res = await fetch('/api/v1/evidence/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          let message = 'Upload failed';
          try {
            const body = await res.json();
            if (body?.error) message = String(body.error);
          } catch {
            // fall through with default
          }
          setError(message);
          return;
        }

        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [entityId, entityType, reload],
  );

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      data-testid={`entity-evidence-${entityType}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          {heading}
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {items.length} attached
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        data-testid="entity-evidence-file-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          void upload(files);
        }}
      />

      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-xs transition-colors disabled:opacity-60 ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-glass-border hover:border-glass-border-strong'
        }`}
      >
        <Upload className="h-4 w-4 text-muted-foreground" />
        {isUploading ? 'Uploading…' : 'Drag a file here or click to browse'}
      </button>

      {error && (
        <div
          role="alert"
          data-testid="entity-evidence-error"
          className="mt-3 flex items-start gap-2 rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-500"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyState}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              data-testid="entity-evidence-item"
              className="flex items-start gap-3 rounded-md border border-glass-border bg-glass-subtle p-2.5"
            >
              <FileText className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {item.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{item.submittedBy.name}</span>
                  <span>•</span>
                  <span className="font-mono">
                    {new Date(item.submittedAt).toLocaleString()}
                  </span>
                  {item.locked && (
                    <span className="inline-flex items-center gap-0.5 rounded border border-amber-400/30 bg-amber-400/10 px-1 py-0 text-amber-500">
                      <Lock className="h-2 w-2" /> Sealed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
