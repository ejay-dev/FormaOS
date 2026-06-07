/**
 * Automation Onboarding Success Panel
 * Shows after onboarding to explain automation is now active
 */

'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, Bell, FileCheck, TrendingUp, Workflow } from 'lucide-react';
import { useState } from 'react';

export function AutomationOnboardingSuccess() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card className="relative overflow-hidden border border-border bg-card">
      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <Workflow className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                Automation Is Working For You
              </h3>
              <p className="text-sm text-muted-foreground">
                FormaOS is now monitoring compliance automatically
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Controls Monitoring */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Controls Monitoring
              </h4>
              <p className="text-sm text-muted-foreground">
                Automatically tracking control status and triggering alerts when compliance fails
              </p>
            </div>
          </div>

          {/* Evidence Reminders */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Evidence Reminders
              </h4>
              <p className="text-sm text-muted-foreground">
                Creating renewal tasks when evidence expires and notifying your compliance team
              </p>
            </div>
          </div>

          {/* Policy Review Scheduling */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Policy Review Scheduling
              </h4>
              <p className="text-sm text-muted-foreground">
                Scheduling periodic policy reviews and generating tasks for compliance officers
              </p>
            </div>
          </div>

          {/* Risk Scoring */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Risk Scoring
              </h4>
              <p className="text-sm text-muted-foreground">
                Calculating real-time compliance health scores and alerting on risk level changes
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-sm font-medium text-success">
              Automation Active
            </span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">
            Running in the background 24/7
          </span>
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 rounded-lg bg-surface-1 border border-border">
          <p className="text-sm text-foreground">
            <strong>What happens next?</strong> FormaOS will continuously monitor your compliance state
            and automatically create tasks, send notifications, and update your compliance score.
            You&apos;ll see automation activity in your dashboard timeline.
          </p>
        </div>
      </div>
    </Card>
  );
}
