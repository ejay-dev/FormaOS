/**
 * Automation Activity Timeline
 * Shows recent automation events with visual timeline
 */

'use client';

import { useEffect, useState } from 'react';
import { getAutomationHistory } from '@/app/app/actions/automation';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  FileCheck,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface AutomationEvent {
  id: string;
  workflowId: string;
  trigger: string;
  status: string;
  actionsExecuted: number;
  executedAt: string;
  errorMessage?: string;
}

const TRIGGER_ICONS: Record<string, any> = {
  evidence_expiry: FileCheck,
  policy_review_due: FileCheck,
  control_failed: AlertCircle,
  control_incomplete: Shield,
  task_overdue: Clock,
  risk_score_change: TrendingUp,
  certification_expiring: Bell,
  org_onboarding: Zap,
};

const TRIGGER_LABELS: Record<string, string> = {
  evidence_expiry: 'Evidence Renewal Required',
  policy_review_due: 'Policy Review Scheduled',
  control_failed: 'Control Failure Detected',
  control_incomplete: 'Control Action Required',
  task_overdue: 'Overdue Task Escalated',
  risk_score_change: 'Risk Level Changed',
  certification_expiring: 'Certification Renewal Due',
  org_onboarding: 'Onboarding Automation Triggered',
};

const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  evidence_expiry: 'Created renewal task and notified compliance team',
  policy_review_due: 'Generated review task for policy update cycle',
  control_failed: 'Escalated to admins and created remediation task',
  control_incomplete: 'Created completion task for at-risk control',
  task_overdue: 'Sent escalation notifications to task owners',
  risk_score_change: 'Notified leadership of compliance risk increase',
  certification_expiring: 'Created renewal task and alerted compliance officers',
  org_onboarding: 'Generated onboarding task sequence',
};

export function AutomationTimeline({ limit = 10 }: { limit?: number }) {
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [limit]);

  async function loadEvents() {
    try {
      const data = await getAutomationHistory(limit);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load automation history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Zap className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Automation is Monitoring
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          FormaOS is actively monitoring your compliance. Automation events will appear here
          as they occur.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Automation Activity
          </h3>
          <p className="text-sm text-gray-600">
            FormaOS working automatically for you
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-700">Active</span>
        </div>
      </div>

      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 to-transparent"></div>

        {events.map((event, index) => {
          const Icon = TRIGGER_ICONS[event.trigger] || CheckCircle2;
          const isSuccess = event.status === 'success';

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${
                  isSuccess
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {TRIGGER_LABELS[event.trigger] || event.trigger}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {TRIGGER_DESCRIPTIONS[event.trigger] ||
                          'Automation workflow executed'}
                      </p>
                    </div>
                    {isSuccess && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(event.executedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {event.actionsExecuted} actions
                    </div>
                  </div>

                  {event.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                      <p className="text-xs text-red-700">{event.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length >= limit && (
        <div className="mt-4 text-center">
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            View All Activity →
          </button>
        </div>
      )}
    </Card>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
