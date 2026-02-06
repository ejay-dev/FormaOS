/**
 * Compliance Toast Alerts
 * In-app toast notifications for critical compliance risks
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X, Shield, TrendingDown } from 'lucide-react';
import { getAutomationHistory } from '@/app/app/actions/automation';

interface Toast {
  id: string;
  type: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

export function ComplianceToastAlerts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastCheckedId, setLastCheckedId] = useState<string | null>(null);

  useEffect(() => {
    checkForNewAlerts();
    // Check for new alerts every 30 seconds
    const interval = setInterval(checkForNewAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkForNewAlerts() {
    try {
      const history = await getAutomationHistory(5);

      if (history.length === 0) return;

      // Get most recent event
      const latestEvent = history[0];

      // Skip if we've already shown this event
      if (latestEvent.id === lastCheckedId) return;

      // Only show toasts for critical/high priority events
      const criticalTriggers = [
        'control_failed',
        'risk_score_change',
        'control_incomplete',
        'task_overdue',
      ];

      if (criticalTriggers.includes(latestEvent.trigger)) {
        const toast: Toast = {
          id: latestEvent.id,
          type: getCriticalityType(latestEvent.trigger),
          title: getToastTitle(latestEvent.trigger),
          message: getToastMessage(latestEvent.trigger, latestEvent.actionsExecuted),
          timestamp: latestEvent.executedAt,
        };

        setToasts((prev) => [toast, ...prev].slice(0, 3)); // Keep max 3 toasts
        setLastCheckedId(latestEvent.id);

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          dismissToast(toast.id);
        }, 10000);
      } else {
        setLastCheckedId(latestEvent.id);
      }
    } catch (error) {
      console.error('Failed to check for alerts:', error);
    }
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = getToastIcon(toast.type);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border-2 backdrop-blur-sm animate-slide-in-right ${
        toast.type === 'critical'
          ? 'bg-red-50/95 border-red-300'
          : toast.type === 'warning'
            ? 'bg-orange-50/95 border-orange-300'
            : 'bg-green-50/95 border-green-300'
      }`}
      role="alert"
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          toast.type === 'critical'
            ? 'bg-red-100'
            : toast.type === 'warning'
              ? 'bg-orange-100'
              : 'bg-green-100'
        }`}
      >
        <Icon
          className={`w-5 h-5 ${
            toast.type === 'critical'
              ? 'text-red-600'
              : toast.type === 'warning'
                ? 'text-orange-600'
                : 'text-green-600'
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={`font-semibold mb-1 ${
            toast.type === 'critical'
              ? 'text-red-900'
              : toast.type === 'warning'
                ? 'text-orange-900'
                : 'text-green-900'
          }`}
        >
          {toast.title}
        </h4>
        <p
          className={`text-sm ${
            toast.type === 'critical'
              ? 'text-red-700'
              : toast.type === 'warning'
                ? 'text-orange-700'
                : 'text-green-700'
          }`}
        >
          {toast.message}
        </p>
        <p className="text-xs text-gray-500 mt-2">{formatRelativeTime(toast.timestamp)}</p>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
          toast.type === 'critical'
            ? 'hover:bg-red-100 text-red-600'
            : toast.type === 'warning'
              ? 'hover:bg-orange-100 text-orange-600'
              : 'hover:bg-green-100 text-green-600'
        }`}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function getCriticalityType(trigger: string): 'critical' | 'warning' | 'success' {
  if (['control_failed', 'risk_score_change'].includes(trigger)) {
    return 'critical';
  }
  if (['control_incomplete', 'task_overdue'].includes(trigger)) {
    return 'warning';
  }
  return 'success';
}

function getToastIcon(type: string) {
  switch (type) {
    case 'critical':
      return AlertCircle;
    case 'warning':
      return Shield;
    default:
      return CheckCircle2;
  }
}

function getToastTitle(trigger: string): string {
  const titles: Record<string, string> = {
    control_failed: 'Critical: Control Failure',
    risk_score_change: 'Compliance Risk Increased',
    control_incomplete: 'Control Requires Attention',
    task_overdue: 'Tasks Overdue',
  };
  return titles[trigger] || 'Compliance Alert';
}

function getToastMessage(trigger: string, actionsExecuted: number): string {
  const messages: Record<string, string> = {
    control_failed: `Control compliance failed. ${actionsExecuted} remediation task${actionsExecuted > 1 ? 's' : ''} created and admins notified.`,
    risk_score_change: 'Your compliance risk level has increased. Leadership has been notified.',
    control_incomplete: `${actionsExecuted} control${actionsExecuted > 1 ? 's' : ''} require${actionsExecuted === 1 ? 's' : ''} completion. Tasks created.`,
    task_overdue: `${actionsExecuted} overdue task${actionsExecuted > 1 ? 's' : ''}. Escalation notifications sent.`,
  };
  return messages[trigger] || `Automation workflow executed ${actionsExecuted} actions.`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  return 'Recently';
}
