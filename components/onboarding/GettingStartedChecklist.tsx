'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app';

const CHECKLIST_ITEMS = [
  {
    id: 'task',
    label: 'Create your first task',
    description: 'Add a compliance requirement and assign an owner.',
    href: '/app/tasks',
  },
  {
    id: 'evidence',
    label: 'Upload first evidence',
    description: 'Store a compliance artifact in the vault.',
    href: '/app/vault',
  },
  {
    id: 'invite',
    label: 'Invite a teammate',
    description: 'Bring your compliance team into FormaOS.',
    href: '/app/team',
  },
  {
    id: 'compliance',
    label: 'Review compliance status',
    description: 'Check live compliance scores and gaps.',
    href: '/app/reports',
  },
  {
    id: 'reports',
    label: 'Preview an export report',
    description: 'Generate a report snapshot for audit readiness.',
    href: '/app/reports',
  },
];

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

export function GettingStartedChecklist() {
  const organizationId = useAppStore((s) => s.organization?.id ?? null);
  const [counts, setCounts] = useState({
    tasks: 0,
    evidence: 0,
    members: 0,
    complianceChecks: 0,
    reports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

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
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklist();
    const handleFocus = () => fetchChecklist();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [organizationId]);

  const completionState = useMemo(() => {
    return {
      task: counts.tasks > 0,
      evidence: counts.evidence > 0,
      invite: counts.members > 1,
      compliance: counts.complianceChecks > 0,
      reports: counts.reports > 0,
    };
  }, [counts]);

  const completedCount = Object.values(completionState).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  useEffect(() => {
    if (progress !== 100) return;
    const key = `formaos_checklist_confetti_${organizationId ?? 'org'}`;
    if (typeof window !== 'undefined' && localStorage.getItem(key)) return;

    setShowConfetti(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, 'true');
    }
    const timer = window.setTimeout(() => setShowConfetti(false), 1600);
    return () => window.clearTimeout(timer);
  }, [organizationId, progress]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6">
      {showConfetti ? <ConfettiBurst /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Getting Started
          </p>
          <h3 className="text-lg font-semibold text-slate-100">
            Your first wins in FormaOS
          </h3>
          <p className="text-sm text-slate-400">
            Complete these steps to activate your compliance workspace.
          </p>
        </div>
        <div className="min-w-[180px]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{completedCount} of {totalCount} done</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {CHECKLIST_ITEMS.map((item) => {
          const isComplete = completionState[item.id as keyof typeof completionState];
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </div>
              <span className="text-slate-500">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
        {isLoading ? (
          <div className="text-xs text-slate-500">Refreshing progress...</div>
        ) : null}
      </div>
    </div>
  );
}
