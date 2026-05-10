'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  NotebookPen,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';

import { markFirstSessionStepSeen } from '@/app/app/actions/onboarding-first-session';
import { useOnboarding } from '@/lib/onboarding/onboarding-context';

type IconType = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

const STEP_MESSAGE: Record<string, string> = {
  'create-care-plan': "Great! You've created your first Care Plan.",
  'add-goal': 'Nice — first goal added. Progress is now trackable.',
  'log-progress-note':
    "Well done — your first progress note is live.",
  'upload-evidence': 'Evidence locked in. Your vault is no longer empty.',
  'review-task': 'Task reviewed. Compliance work now flows from the dashboard.',
};

const STEP_ICON: Record<string, IconType> = {
  'create-care-plan': ClipboardList,
  'add-goal': Target,
  'log-progress-note': NotebookPen,
  'upload-evidence': ShieldCheck,
  'review-task': FileCheck2,
};

export function OnboardingSuccessToast() {
  const pathname = usePathname();
  const { state, freshlyCompletedSteps } = useOnboarding();
  const [localDismissed, setLocalDismissed] = useState<string[]>([]);

  // Only surface on the dashboard. On step-owner pages the mark-seen server
  // action races with in-flight form submissions (care-plan edits observed
  // to drop writes when the toast auto-dismissed mid-edit).
  const onDashboard = pathname === '/app';

  const visibleStepId = useMemo(
    () =>
      freshlyCompletedSteps.find((id) => !localDismissed.includes(id)) ?? null,
    [freshlyCompletedSteps, localDismissed],
  );

  const step =
    visibleStepId && state
      ? state.steps.find((s) => s.id === visibleStepId) ?? null
      : null;

  // Persist "seen" on the server when the user dismisses the toast (click or
  // auto-timeout). Firing on mount instead was observed to race with form
  // submissions on the same page and caused lost writes.
  const dismiss = (stepId: string) => {
    setLocalDismissed((prev) =>
      prev.includes(stepId) ? prev : [...prev, stepId],
    );
    markFirstSessionStepSeen(stepId as Parameters<typeof markFirstSessionStepSeen>[0])
      .catch(() => {
        // Table may not exist yet (pre-migration). UI still works.
      });
  };

  // Explicit dismissal only. Auto-dismissing used to fire the mark-seen
  // server action in the background while users were interacting with
  // forms on the next page — easier to let the user acknowledge.

  if (!onDashboard) return null;
  if (!step || !visibleStepId) return null;

  const message = STEP_MESSAGE[step.id] ?? `Great! ${step.label} is done.`;
  const StepIcon = STEP_ICON[step.id] ?? CheckCircle2;
  const complianceNote = step.complianceNote;

  return (
    <div
      data-testid="onboarding-success-toast"
      data-step={step.id}
      className="pointer-events-none fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-lg backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-start gap-3">
        <div className="relative mt-0.5">
          <StepIcon
            className="h-5 w-5 shrink-0 text-emerald-500"
            aria-hidden
          />
          <CheckCircle2
            className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-background text-emerald-500"
            aria-hidden
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{message}</p>
          {complianceNote ? (
            <p
              className="mt-0.5 text-xs text-muted-foreground"
              data-testid="onboarding-success-toast-note"
            >
              {complianceNote}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Keep going — the next step is waiting in the strip above.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => dismiss(visibleStepId)}
          className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Dismiss onboarding success message"
          data-testid="onboarding-success-toast-dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
