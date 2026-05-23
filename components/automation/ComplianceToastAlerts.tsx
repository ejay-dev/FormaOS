/**
 * Compliance Toast Alerts
 * In-app toast notifications for critical compliance risks.
 *
 * Audit Sprint 7b (2026-05-24): the previous implementation hand-rolled
 * its own portal + ToastItem render + dismiss buttons. The 30-second
 * polling against getAutomationHistory() stays (that's the real job);
 * the rendering side moved to sonner via the shared Toaster mounted at
 * the app root. Component now returns null.
 */

'use client';

import { useEffect, useRef } from 'react';
import { getAutomationHistory } from '@/app/app/actions/automation';
import { toast } from '@/components/ui/toaster';

const POLL_INTERVAL_MS = 30_000;
const TOAST_DURATION_MS = 10_000;

const CRITICAL_TRIGGERS = new Set([
  'control_failed',
  'risk_score_change',
  'control_incomplete',
  'task_overdue',
]);

const TITLE_BY_TRIGGER: Record<string, string> = {
  control_failed: 'Critical: Control Failure',
  risk_score_change: 'Compliance Risk Increased',
  control_incomplete: 'Control Requires Attention',
  task_overdue: 'Tasks Overdue',
};

function messageFor(trigger: string, actionsExecuted: number): string {
  switch (trigger) {
    case 'control_failed':
      return `Control compliance failed. ${actionsExecuted} remediation task${actionsExecuted === 1 ? '' : 's'} created and admins notified.`;
    case 'risk_score_change':
      return 'Your compliance risk level has increased. Leadership has been notified.';
    case 'control_incomplete':
      return `${actionsExecuted} control${actionsExecuted === 1 ? '' : 's'} require${actionsExecuted === 1 ? 's' : ''} completion. Tasks created.`;
    case 'task_overdue':
      return `${actionsExecuted} overdue task${actionsExecuted === 1 ? '' : 's'}. Escalation notifications sent.`;
    default:
      return `Automation workflow executed ${actionsExecuted} actions.`;
  }
}

function variantFor(
  trigger: string,
): (msg: string, opts?: { description?: string; duration?: number }) => void {
  if (trigger === 'control_failed' || trigger === 'risk_score_change') {
    return toast.error;
  }
  return toast.warning;
}

export function ComplianceToastAlerts() {
  // Ref instead of state — we don't re-render, only need the value
  // across poll ticks so we don't toast the same event twice.
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkForNewAlerts() {
      if (cancelled) return;
      try {
        const history = await getAutomationHistory(5);
        if (!Array.isArray(history) || history.length === 0) return;

        const latest = history[0];
        if (latest.id === lastSeenIdRef.current) return;
        lastSeenIdRef.current = latest.id;

        if (!CRITICAL_TRIGGERS.has(latest.trigger)) return;

        variantFor(latest.trigger)(
          TITLE_BY_TRIGGER[latest.trigger] ?? 'Compliance Alert',
          {
            description: messageFor(latest.trigger, latest.actionsExecuted),
            duration: TOAST_DURATION_MS,
          },
        );
      } catch (error) {
        // Polling failure is non-fatal — the next tick retries.
        console.error('Failed to check for alerts:', error);
      }
    }

    void checkForNewAlerts();
    const interval = window.setInterval(checkForNewAlerts, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
