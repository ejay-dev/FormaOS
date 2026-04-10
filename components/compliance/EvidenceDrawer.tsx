'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Paperclip,
  Lock,
  Upload,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Clock,
  Download,
  User,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface EvidenceItem {
  id: string;
  type: 'file' | 'link' | 'note';
  title: string;
  description?: string;
  submittedBy: { name: string; avatarUrl?: string };
  submittedAt: string;
  locked: boolean;
  fileUrl?: string;
  linkUrl?: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  actor: { name: string; avatarUrl?: string };
  timestamp: string;
  locked: boolean;
}

interface EvidenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligationId: string;
  obligationTitle: string;
}

export function EvidenceDrawer({
  open,
  onOpenChange,
  obligationId,
  obligationTitle,
}: EvidenceDrawerProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [tab, setTab] = useState<'evidence' | 'activity'>('evidence');

  useEffect(() => {
    if (!open || !obligationId) return;
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const [evRes, actRes] = await Promise.all([
          fetch(
            `/api/v1/evidence?obligationId=${encodeURIComponent(obligationId)}`,
          ),
          fetch(
            `/api/v1/audit-trail?entityId=${encodeURIComponent(obligationId)}&limit=20`,
          ),
        ]);
        const evData = evRes.ok ? await evRes.json() : { items: [] };
        const actData = actRes.ok ? await actRes.json() : { entries: [] };
        if (mounted) {
          setEvidence(evData.items ?? []);
          setActivities(actData.entries ?? []);
        }
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
  }, [open, obligationId]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // Upload files
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('obligationId', obligationId);

      fetch('/api/v1/evidence/upload', { method: 'POST', body: formData })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Upload failed');
        })
        .then((data) => {
          setEvidence((prev) => [...(data.items ?? []), ...prev]);
        })
        .catch(() => {});
    },
    [obligationId],
  );

  const typeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return FileText;
      case 'link':
        return LinkIcon;
      case 'note':
        return MessageSquare;
      default:
        return FileText;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[90vw] max-w-[480px] sm:max-w-lg flex flex-col"
      >
        <SheetHeader className="border-b border-glass-border pb-4">
          <SheetTitle className="text-base font-semibold">
            Evidence & Activity
          </SheetTitle>
          <p className="text-xs text-muted-foreground truncate">
            {obligationTitle}
          </p>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-glass-border">
          <button
            onClick={() => setTab('evidence')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              tab === 'evidence'
                ? 'border-b-2 border-[var(--wire-action)] text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Paperclip className="inline h-3 w-3 mr-1" />
            Evidence ({evidence.length})
          </button>
          <button
            onClick={() => setTab('activity')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              tab === 'activity'
                ? 'border-b-2 border-[var(--wire-action)] text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="inline h-3 w-3 mr-1" />
            Activity ({activities.length})
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto py-3">
          {isLoading ? (
            <div className="space-y-3 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : tab === 'evidence' ? (
            <div className="space-y-3 px-1">
              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                  isDragOver
                    ? 'border-[var(--wire-action)] bg-[var(--wire-action)]/5'
                    : 'border-glass-border hover:border-glass-border-strong'
                }`}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Drag files here or{' '}
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="cursor-pointer text-[var(--wire-action)] underline">
                    browse
                  </label>
                </p>
              </div>

              {/* Evidence list */}
              {evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No evidence attached yet.
                </p>
              ) : (
                evidence.map((item) => {
                  const Icon = typeIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border border-glass-border bg-glass-subtle p-3"
                    >
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </p>
                          {item.locked && (
                            <Lock
                              className="h-3 w-3 text-amber-400 shrink-0"
                              aria-label="Immutable — cannot be edited"
                            />
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          <span>{item.submittedBy.name}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {new Date(item.submittedAt).toLocaleString()}
                          </span>
                          {item.locked && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0"
                            >
                              <Lock className="h-2 w-2 mr-0.5" /> Sealed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Activity log */
            <div className="space-y-1 px-1">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity recorded.
                </p>
              ) : (
                activities.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 rounded-lg px-2 py-2"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-glass-subtle border border-glass-border shrink-0">
                      {entry.actor.avatarUrl ? (
                        <img
                          src={entry.actor.avatarUrl}
                          alt={entry.actor.name}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <User className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground">
                        <span className="font-medium">{entry.actor.name}</span>{' '}
                        <span className="text-muted-foreground">
                          {entry.action}
                        </span>
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        {entry.locked && (
                          <Lock
                            className="h-2.5 w-2.5 text-amber-400"
                            aria-label="Immutable entry"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.open(
                `/api/v1/evidence/export?obligationId=${encodeURIComponent(obligationId)}`,
                '_blank',
              );
            }}
            className="w-full"
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Export Evidence Pack
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
