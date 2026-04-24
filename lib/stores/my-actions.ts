'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type MyActionStatus =
  | 'overdue'
  | 'due_today'
  | 'due_soon'
  | 'in_progress'
  | 'pending';

export type MyActionType = 'obligation' | 'task' | 'evidence_review' | 'incident';

export interface MyAction {
  id: string;
  title: string;
  dueDate: string;
  status: MyActionStatus;
  type: MyActionType;
  entityId?: string;
  entityHref?: string;
  ownerName?: string | null;
  frameworkCode?: string | null;
}

interface FetchState {
  actions: MyAction[];
  isLoading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface MyActionsState extends FetchState {
  fetch: (opts?: { force?: boolean; signal?: AbortSignal }) => Promise<void>;
  updateStatus: (id: string, next: MyActionStatus) => Promise<boolean>;
  reset: () => void;
}

const STALE_MS = 60_000; // 1 min: treat as stale, revalidate
const DEDUPE_MS = 5_000; // 5s: coalesce concurrent callers

let inFlight: Promise<void> | null = null;

function sortByUrgency(list: MyAction[]): MyAction[] {
  const priority: Record<MyActionStatus, number> = {
    overdue: 0,
    due_today: 1,
    due_soon: 2,
    in_progress: 3,
    pending: 4,
  };
  return [...list].sort((a, b) => {
    const p = priority[a.status] - priority[b.status];
    if (p !== 0) return p;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export const useMyActionsStore = create<MyActionsState>()(
  subscribeWithSelector((set, get) => ({
    actions: [],
    isLoading: false,
    hasLoadedOnce: false,
    error: null,
    lastFetched: null,

    fetch: async (opts = {}) => {
      const { force = false, signal } = opts;
      const state = get();

      if (!force && state.lastFetched && Date.now() - state.lastFetched < DEDUPE_MS) {
        return;
      }
      if (inFlight) {
        await inFlight;
        return;
      }

      set({ isLoading: true, error: null });

      inFlight = (async () => {
        try {
          const res = await fetch('/api/v1/tasks/my-actions', { signal });
          if (!res.ok) throw new Error(`Failed: ${res.status}`);
          const data = await res.json();
          const items: MyAction[] = Array.isArray(data.actions)
            ? data.actions
            : [];
          set({
            actions: sortByUrgency(items),
            isLoading: false,
            hasLoadedOnce: true,
            error: null,
            lastFetched: Date.now(),
          });
        } catch (err) {
          if ((err as { name?: string }).name === 'AbortError') {
            set({ isLoading: false });
            return;
          }
          set({
            isLoading: false,
            hasLoadedOnce: true,
            error:
              err instanceof Error ? err.message : 'Failed to load actions',
          });
        } finally {
          inFlight = null;
        }
      })();

      await inFlight;
    },

    updateStatus: async (id, next) => {
      const prevList = get().actions;
      // Optimistic update
      set({
        actions: sortByUrgency(
          prevList.map((a) => (a.id === id ? { ...a, status: next } : a)),
        ),
      });
      try {
        const res = await fetch(`/api/v1/tasks/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        return true;
      } catch {
        // Rollback on failure
        set({ actions: prevList });
        return false;
      }
    },

    reset: () =>
      set({
        actions: [],
        isLoading: false,
        hasLoadedOnce: false,
        error: null,
        lastFetched: null,
      }),
  })),
);

export function isStale(lastFetched: number | null): boolean {
  if (lastFetched === null) return true;
  return Date.now() - lastFetched > STALE_MS;
}

export function useMyActions() {
  return useMyActionsStore((s) => s.actions);
}

export function useMyActionsMeta() {
  return useMyActionsStore((s) => ({
    isLoading: s.isLoading,
    hasLoadedOnce: s.hasLoadedOnce,
    error: s.error,
    lastFetched: s.lastFetched,
  }));
}
