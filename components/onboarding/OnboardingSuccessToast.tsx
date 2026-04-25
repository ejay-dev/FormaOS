'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

import { markFirstSessionStepSeen } from '@/app/app/actions/onboarding-first-session';
import { useOnboarding } from '@/lib/onboarding/onboarding-context';

const STEP_MESSAGE: Record<string, string> = {
  'create-care-plan': "Great! You've created your first Care Plan.",
  'add-goal': 'Nice — first goal added. Progress is now trackable.',
  'log-progress-note':
    "Well done — your first progress note is live.",
  'upload-evidence': 'Evidence locked in. Your vault is no longer empty.',
  'review-task': 'Task reviewed. Compliance work now flows from the dashboard.',
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

  return (
    <div
      data-testid="onboarding-success-toast"
      data-step={step.id}
      className="pointer-events-none fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-lg backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-start gap-3">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{message}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Keep going — the next step is waiting in the strip above.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dismiss(visibleStepId)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Dismiss onboarding success message"
          data-testid="onboarding-success-toast-dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
