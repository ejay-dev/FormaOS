/**
 * Automation Onboarding Success Panel
 * Shows after onboarding to explain automation is now active
 */

'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, Shield, Bell, FileCheck, TrendingUp, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function AutomationOnboardingSuccess() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Automation Is Working For You
              </h3>
              <p className="text-sm text-gray-600">
                FormaOS is now monitoring compliance automatically
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Controls Monitoring
              </h4>
              <p className="text-sm text-gray-600">
                Automatically tracking control status and triggering alerts when compliance fails
              </p>
            </div>
          </div>

          {/* Evidence Reminders */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Evidence Reminders
              </h4>
              <p className="text-sm text-gray-600">
                Creating renewal tasks when evidence expires and notifying your compliance team
              </p>
            </div>
          </div>

          {/* Policy Review Scheduling */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Policy Review Scheduling
              </h4>
              <p className="text-sm text-gray-600">
                Scheduling periodic policy reviews and generating tasks for compliance officers
              </p>
            </div>
          </div>

          {/* Risk Scoring */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Risk Scoring
              </h4>
              <p className="text-sm text-gray-600">
                Calculating real-time compliance health scores and alerting on risk level changes
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              Automation Active
            </span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600">
            Running in the background 24/7
          </span>
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-900">
            <strong>What happens next?</strong> FormaOS will continuously monitor your compliance state
            and automatically create tasks, send notifications, and update your compliance score.
            You&apos;ll see automation activity in your dashboard timeline.
          </p>
        </div>
      </div>
    </Card>
  );
}
