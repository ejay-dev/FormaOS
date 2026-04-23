'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createSupabaseClient } from '@/lib/supabase/client';

export type JourneyStageTone =
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'info'
  | 'success'
  | 'muted';

export interface JourneyStage {
  key: string;
  label: string;
  tone: JourneyStageTone;
  description?: string;
}

export interface JourneyCardMeta {
  label: string;
  value: string;
  tone?: JourneyStageTone;
}

export interface JourneyItem {
  id: string;
  stageKey: string;
  title: string;
  subtitle?: string;
  badge?: { label: string; tone?: JourneyStageTone };
  meta?: JourneyCardMeta[];
  href?: string;
  accent?: string;
  emphasise?: boolean;
}

export type JourneyMoveResult =
  | { success: true }
  | { success: false; error: string };

export interface JourneyRealtimeConfig {
  table: string;
  orgColumn?: string;
  orgId: string;
}

export interface JourneyBoardProps {
  stages: JourneyStage[];
  items: JourneyItem[];
  emptyLabel?: string;
  className?: string;
  onMove?: (
    itemId: string,
    fromStage: string,
    toStage: string,
  ) => Promise<JourneyMoveResult>;
  realtime?: JourneyRealtimeConfig;
}

const TONE_SURFACE: Record<JourneyStageTone, string> = {
  neutral: 'border-glass-border bg-glass-subtle',
  danger: 'border-red-500/25 bg-red-500/5',
  warning: 'border-amber-500/25 bg-amber-500/5',
  info: 'border-blue-500/25 bg-blue-500/5',
  success: 'border-emerald-500/25 bg-emerald-500/5',
  muted: 'border-glass-border bg-glass-subtle/50',
};

const TONE_DOT: Record<JourneyStageTone, string> = {
  neutral: 'bg-muted-foreground/60',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  muted: 'bg-muted-foreground/40',
};

const TONE_PILL: Record<JourneyStageTone, string> = {
  neutral: 'border-glass-border bg-glass-subtle text-foreground',
  danger: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  muted: 'border-glass-border bg-glass-subtle text-muted-foreground',
};

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface CardProps {
  item: JourneyItem;
  draggable: boolean;
  isDragging: boolean;
  isPending: boolean;
  onDragStart: (id: string, stage: string) => void;
  onDragEnd: () => void;
}

function JourneyCard({
  item,
  draggable,
  isDragging,
  isPending,
  onDragStart,
  onDragEnd,
}: CardProps) {
  const className = cn(
    'group relative flex flex-col gap-1.5 rounded-lg border p-2 transition-all',
    item.emphasise
      ? 'border-transparent bg-foreground text-background shadow-premium-lg'
      : 'border-glass-border bg-[hsl(var(--card))] hover:border-glass-border-strong hover:shadow-premium-lg',
    draggable && 'cursor-grab active:cursor-grabbing',
    isDragging && 'opacity-40',
    isPending && 'pointer-events-none opacity-60',
    item.href &&
      !draggable &&
      'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
  );

  const body = (
    <>
      {isPending && (
        <span
          className="absolute right-2 top-2 inline-flex"
          aria-label="Saving"
        >
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </span>
      )}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            item.emphasise
              ? 'bg-background/15 text-background'
              : 'bg-primary/10 text-primary',
          )}
          aria-hidden="true"
        >
          {initials(item.accent ?? item.title)}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate text-[12px] font-semibold leading-tight',
              item.emphasise ? 'text-background' : 'text-foreground',
            )}
          >
            {item.title}
          </div>
          {item.subtitle && (
            <div
              className={cn(
                'mt-0.5 line-clamp-1 text-[11px] leading-tight',
                item.emphasise ? 'text-background/70' : 'text-muted-foreground',
              )}
            >
              {item.subtitle}
            </div>
          )}
        </div>
      </div>

      {(item.badge || (item.meta && item.meta.length > 0)) && (
        <div className="flex flex-wrap items-center gap-1">
          {item.badge && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                item.emphasise
                  ? 'border-background/25 bg-background/15 text-background'
                  : TONE_PILL[item.badge.tone ?? 'neutral'],
              )}
            >
              {item.badge.label}
            </span>
          )}
          {item.meta?.map((m) => (
            <span
              key={m.label}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                item.emphasise
                  ? 'bg-background/10 text-background/80'
                  : 'bg-glass-subtle text-muted-foreground',
              )}
              title={m.label}
            >
              <span className="opacity-60">{m.label}</span>
              <span
                className={cn(
                  'font-semibold',
                  item.emphasise
                    ? 'text-background'
                    : m.tone === 'danger'
                      ? 'text-red-400'
                      : m.tone === 'warning'
                        ? 'text-amber-400'
                        : m.tone === 'success'
                          ? 'text-emerald-400'
                          : 'text-foreground',
                )}
              >
                {m.value}
              </span>
            </span>
          ))}
        </div>
      )}
    </>
  );

  const dragHandlers = draggable
    ? {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData('text/plain', item.id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStart(item.id, item.stageKey);
        },
        onDragEnd,
      }
    : {};

  if (draggable) {
    return (
      <div className={className} {...dragHandlers}>
        {body}
      </div>
    );
  }

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

interface DragState {
  itemId: string;
  fromStage: string;
}

export function JourneyBoard({
  stages,
  items: itemsProp,
  emptyLabel = 'No items',
  className,
  onMove,
  realtime,
}: JourneyBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState<JourneyItem[]>(itemsProp);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Upstream data refresh reconciles the local optimistic state.
  useEffect(() => {
    setItems(itemsProp);
  }, [itemsProp]);

  useEffect(() => {
    if (!realtime) return;
    const client = createSupabaseClient();
    const column = realtime.orgColumn ?? 'organization_id';
    const channel = client
      .channel(`journey-${realtime.table}-${realtime.orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: realtime.table,
          filter: `${column}=eq.${realtime.orgId}`,
        },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [realtime, router]);

  const grouped = useMemo(
    () =>
      stages.map((stage) => ({
        stage,
        items: items.filter((i) => i.stageKey === stage.key),
      })),
    [stages, items],
  );

  const canDrag = Boolean(onMove);

  async function handleDrop(toStage: string) {
    setDropTarget(null);
    if (!drag || !onMove) {
      setDrag(null);
      return;
    }
    const { itemId, fromStage } = drag;
    setDrag(null);
    if (fromStage === toStage) return;

    const previous = items;
    const optimistic = items.map((i) =>
      i.id === itemId ? { ...i, stageKey: toStage } : i,
    );
    setItems(optimistic);
    setPendingId(itemId);
    setError(null);

    const result = await onMove(itemId, fromStage, toStage);
    setPendingId(null);

    if (!result.success) {
      setItems(previous);
      setError(result.error);
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {error && (
        <div
          role="alert"
          className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs text-red-400"
        >
          <span>Could not update: {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-semibold uppercase tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 items-stretch gap-1.5 overflow-x-auto overflow-y-hidden">
        {grouped.map(({ stage, items: stageItems }, idx) => {
          const isDropTarget = dropTarget === stage.key;
          return (
            <div
              key={stage.key}
              className="flex min-h-0 items-stretch gap-1.5"
            >
              <section
                aria-label={stage.label}
                onDragOver={
                  canDrag
                    ? (e) => {
                        if (!drag) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dropTarget !== stage.key) setDropTarget(stage.key);
                      }
                    : undefined
                }
                onDragLeave={
                  canDrag
                    ? (e) => {
                        const next = e.relatedTarget as Node | null;
                        if (!e.currentTarget.contains(next)) {
                          if (dropTarget === stage.key) setDropTarget(null);
                        }
                      }
                    : undefined
                }
                onDrop={canDrag ? () => handleDrop(stage.key) : undefined}
                className={cn(
                  'flex min-h-0 w-[224px] shrink-0 flex-col rounded-xl border transition-colors',
                  TONE_SURFACE[stage.tone],
                  isDropTarget && 'ring-2 ring-primary/60',
                )}
              >
                <header
                  className="flex items-center justify-between gap-2 border-b border-glass-border/60 px-2.5 py-1.5"
                  title={stage.description}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        TONE_DOT[stage.tone],
                      )}
                      aria-hidden="true"
                    />
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
                      {stage.label}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] leading-4"
                  >
                    {stageItems.length}
                  </Badge>
                </header>

                <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
                  {stageItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-glass-border px-2 py-2 text-center text-[11px] text-muted-foreground">
                      {isDropTarget ? 'Drop here' : emptyLabel}
                    </div>
                  ) : (
                    stageItems.map((item) => (
                      <JourneyCard
                        key={item.id}
                        item={item}
                        draggable={canDrag}
                        isDragging={drag?.itemId === item.id}
                        isPending={pendingId === item.id}
                        onDragStart={(id, stageKey) =>
                          setDrag({ itemId: id, fromStage: stageKey })
                        }
                        onDragEnd={() => {
                          setDrag(null);
                          setDropTarget(null);
                        }}
                      />
                    ))
                  )}
                </div>
              </section>

              {idx < grouped.length - 1 && (
                <div
                  className="flex w-4 shrink-0 items-center justify-center text-muted-foreground/40"
                  aria-hidden="true"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default JourneyBoard;
