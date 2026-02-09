'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/app';
import {
  generateIndustryChecklist,
  getGenericChecklist,
  type ChecklistItem,
  type ChecklistCompletionCounts,
} from '@/lib/onboarding/industry-checklists';

function ConfettiBurst() {
  const pieces = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${(index / pieces.length) * 100}%`,
            animationDelay: `${index * 0.05}s`,
            background: index % 2 === 0 ? '#38bdf8' : '#a78bfa',
          }}
        />
      ))}
    </div>
  );
}

type GettingStartedChecklistProps = {
  industry?: string | null;
};

export function GettingStartedChecklist({
  industry,
}: GettingStartedChecklistProps) {
  const organizationId = useAppStore((s) => s.organization?.id ?? null);
  const [counts, setCounts] = useState<ChecklistCompletionCounts>({
    tasks: 0,
    evidence: 0,
    members: 0,
    complianceChecks: 0,
    reports: 0,
    frameworks: 0,
    policies: 0,
    incidents: 0,
    registers: 0,
    workflows: 0,
    patients: 0,
    orgProfileComplete: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Collapsible state — default to collapsed if all items done
  const STORAGE_KEY = 'formaos:roadmap-collapsed';
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Generate industry-specific checklist
  const checklistItems = useMemo(() => {
    if (industry && industry !== 'other') {
      return generateIndustryChecklist(industry);
    }
    return getGenericChecklist();
  }, [industry]);

  useEffect(() => {
    if (!organizationId) return;

    const fetchChecklist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/onboarding/checklist');
        if (!response.ok) return;
        const data = await response.json();
        setCounts({
          tasks: data.tasks ?? 0,
          evidence: data.evidence ?? 0,
          members: data.members ?? 0,
          complianceChecks: data.complianceChecks ?? 0,
          reports: data.reports ?? 0,
          frameworks: data.frameworks ?? 0,
          policies: data.policies ?? 0,
          incidents: data.incidents ?? 0,
          registers: data.registers ?? 0,
          workflows: data.workflows ?? 0,
          patients: data.patients ?? 0,
          orgProfileComplete: Boolean(data.orgProfileComplete),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklist();
  }, [organizationId]);

  // Calculate completion state using industry-specific logic
  const completionState = useMemo(() => {
    const state: Record<string, boolean> = {};
    for (const item of checklistItems) {
      state[item.id] = item.completionCheck(counts);
    }
    return state;
  }, [checklistItems, counts]);

  const completedCount = Object.values(completionState).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Calculate estimated time remaining
  const timeRemaining = useMemo(() => {
    let minutes = 0;
    for (const item of checklistItems) {
      if (!completionState[item.id]) {
        minutes += item.estimatedMinutes;
      }
    }
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, [checklistItems, completionState]);

  useEffect(() => {
    if (progress === 100 && completedCount > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [progress, completedCount]);

  // Auto-collapse when onboarding is fully complete
  useEffect(() => {
    if (progress === 100 && !isLoading) {
      setIsCollapsed(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [progress, isLoading]);

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
      data-testid="getting-started-checklist"
    >
      {showConfetti && <ConfettiBurst />}
      <div className="relative space-y-6">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-start justify-between text-left group"
          aria-expanded={!isCollapsed}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {industry ? 'Industry Onboarding' : 'Getting Started'}
            </p>
            <h3 className="text-lg font-semibold text-slate-100">
              {industry
                ? `${industry.toUpperCase().replace('_', ' ')} Activation Roadmap`
                : 'Your first wins in FormaOS'}
            </h3>
            <p className="text-sm text-slate-400">
              {industry
                ? 'Complete these steps to activate your compliance infrastructure'
                : 'Complete these steps to activate your compliance workspace'}
            </p>
            {progress < 100 && progress > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>~{timeRemaining} remaining</span>
              </div>
            )}
          </div>
          <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 group-hover:bg-white/10 transition-colors">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>
        <div
          className="w-full sm:min-w-[180px]"
          data-testid="getting-started-progress"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {completedCount} of {totalCount} done
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Collapsible items */}
      {!isCollapsed && (
        <div className="mt-6 space-y-2">
          {checklistItems.map((item) => {
            const isComplete = completionState[item.id] || false;

            // Determine priority border color
            const priorityColors = {
              critical: 'border-l-red-500',
              high: 'border-l-orange-500',
              medium: 'border-l-yellow-500',
              low: 'border-l-slate-500',
            };
            const borderColor =
              priorityColors[item.priority] || 'border-l-slate-500';

            return (
              <Link
                key={item.id}
                href={item.href}
                data-testid={`checklist-item-${item.id}`}
                aria-label={`${isComplete ? 'Completed' : 'Pending'}: ${item.label}`}
                aria-describedby={`desc-${item.id}`}
                className={`flex items-start justify-between gap-3 rounded-xl border border-white/10 ${borderColor} border-l-2 bg-white/5 p-3 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="mt-1"
                    role="img"
                    aria-label={isComplete ? 'Completed' : 'Not completed'}
                  >
                    {isComplete ? (
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="h-4 w-4 text-slate-500"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-100">
                        {item.label}
                      </p>
                      {item.estimatedMinutes > 0 && (
                        <span
                          className="text-xs text-slate-500"
                          aria-label={`Estimated ${item.estimatedMinutes} minutes`}
                        >
                          ~{item.estimatedMinutes}min
                        </span>
                      )}
                      {item.automationTrigger && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span
                            className="flex items-center gap-1 text-cyan-500 cursor-help"
                            aria-label="Automation enabled"
                            title="This step will be verified automatically once the underlying data exists — no manual check-off needed."
                          >
                            <Zap className="h-3 w-3" aria-hidden="true" />
                            Auto-trigger
                          </span>
                        </>
                      )}
                    </div>
                    <p
                      className="text-xs text-slate-400 mt-1"
                      id={`desc-${item.id}`}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
                {!isComplete && (
                  <span
                    className="text-slate-500 hover:text-slate-400 transition-colors"
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                )}
              </Link>
            );
          })}
          {isLoading ? (
            <div className="text-xs text-slate-500">Refreshing progress...</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
