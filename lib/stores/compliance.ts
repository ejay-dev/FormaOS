'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ObligationStatus =
  | 'overdue'
  | 'due_soon'
  | 'on_track'
  | 'completed'
  | 'not_started';
export type RAGStatus = 'red' | 'amber' | 'green';

export interface ComplianceObligation {
  id: string;
  title: string;
  framework: string;
  frameworkCode: string;
  owner: { id: string; name: string; avatarUrl?: string; team?: string } | null;
  dueDate: string;
  status: ObligationStatus;
  evidenceCount: number;
  controlKey: string;
}

export interface ComplianceSummary {
  total: number;
  overdue: number;
  dueSoon: number;
  completed: number;
  completionPercentage: number;
}

export interface ComplianceDeadline {
  id: string;
  title: string;
  dueDate: string;
  type: 'obligation' | 'incident_notification' | 'audit' | 'certification';
  urgency: RAGStatus;
  regulatoryBody?: string;
  industry?: string;
}

interface ComplianceState {
  obligations: ComplianceObligation[];
  summary: ComplianceSummary;
  deadlines: ComplianceDeadline[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setSummary: (summary: ComplianceSummary) => void;
  setObligations: (obligations: ComplianceObligation[]) => void;
  setDeadlines: (deadlines: ComplianceDeadline[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchSummary: () => Promise<void>;
}

export const useComplianceStore = create<ComplianceState>()(
  subscribeWithSelector((set, get) => ({
    obligations: [],
    summary: {
      total: 0,
      overdue: 0,
      dueSoon: 0,
      completed: 0,
      completionPercentage: 0,
    },
    deadlines: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    setSummary: (summary) => set({ summary }),
    setObligations: (obligations) => set({ obligations }),
    setDeadlines: (deadlines) => set({ deadlines }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    fetchSummary: async () => {
      const state = get();
      // Debounce: don't re-fetch within 30 seconds
      if (state.lastFetched && Date.now() - state.lastFetched < 30_000) return;

      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/v1/compliance/summary');
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        set({
          summary: {
            total: data.total ?? 0,
            overdue: data.overdue ?? 0,
            dueSoon: data.dueSoon ?? 0,
            completed: data.completed ?? 0,
            completionPercentage: data.completionPercentage ?? 0,
          },
          obligations: data.obligations ?? [],
          deadlines: data.deadlines ?? [],
          lastFetched: Date.now(),
        });
      } catch (err) {
        set({
          error:
            err instanceof Error
              ? err.message
              : 'Failed to fetch compliance data',
        });
      } finally {
        set({ isLoading: false });
      }
    },
  })),
);

export function useComplianceSummary() {
  return useComplianceStore((s) => s.summary);
}

export function useComplianceObligations() {
  return useComplianceStore((s) => s.obligations);
}

export function useComplianceDeadlines() {
  return useComplianceStore((s) => s.deadlines);
}

export function ragFromStatus(status: ObligationStatus): RAGStatus {
  switch (status) {
    case 'overdue':
      return 'red';
    case 'due_soon':
      return 'amber';
    case 'completed':
    case 'on_track':
      return 'green';
    default:
      return 'amber';
  }
}

export function ragColor(rag: RAGStatus): string {
  switch (rag) {
    case 'red':
      return 'var(--wire-alert)';
    case 'amber':
      return '#f59e0b';
    case 'green':
      return 'var(--wire-success)';
  }
}

export function ragBadgeClass(rag: RAGStatus): string {
  switch (rag) {
    case 'red':
      return 'bg-[var(--wire-alert)]/15 text-[var(--wire-alert)] border-[var(--wire-alert)]/30';
    case 'amber':
      return 'bg-amber-500/15 text-amber-400 border-amber-400/30';
    case 'green':
      return 'bg-[var(--wire-success)]/15 text-[var(--wire-success)] border-[var(--wire-success)]/30';
  }
}
