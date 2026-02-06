/**
 * Automation Showcase - Marketing Section
 * Showcases FormaOS automation capabilities on homepage
 */

'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Zap,
  Shield,
  Bell,
  FileCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function AutomationShowcase() {
  const [activeExample, setActiveExample] = useState(0);

  const automationExamples = [
    {
      id: 0,
      trigger: 'Evidence Expiring',
      icon: FileCheck,
      description: 'Evidence is 90+ days old',
      color: 'blue',
      actions: [
        { text: 'Creates renewal task automatically', icon: CheckCircle2 },
        { text: 'Notifies compliance team via email', icon: Bell },
        { text: 'Updates compliance health score', icon: TrendingUp },
      ],
      stats: { time: '< 1 second', automation: '100%', frequency: 'Every 6 hours' },
    },
    {
      id: 1,
      trigger: 'Control Failure Detected',
      icon: Shield,
      description: 'Control status changes to non-compliant',
      color: 'red',
      actions: [
        { text: 'Escalates to admins immediately', icon: Bell },
        { text: 'Creates CRITICAL remediation task', icon: CheckCircle2 },
        { text: 'Triggers risk score recalculation', icon: TrendingUp },
      ],
      stats: { time: 'Real-time', automation: '100%', frequency: 'Instant' },
    },
    {
      id: 2,
      trigger: 'Policy Review Due',
      icon: FileCheck,
      description: 'Policy not reviewed in 180 days',
      color: 'purple',
      actions: [
        { text: 'Generates review task for policy owners', icon: CheckCircle2 },
        { text: 'Sends notification to compliance officers', icon: Bell },
        { text: 'Schedules follow-up reminder', icon: Clock },
      ],
      stats: { time: '< 1 second', automation: '100%', frequency: 'Every 6 hours' },
    },
    {
      id: 3,
      trigger: 'Task Overdue',
      icon: Clock,
      description: 'Task past due date',
      color: 'orange',
      actions: [
        { text: 'Sends escalation to task owner', icon: Bell },
        { text: 'Notifies managers after 3+ days', icon: Bell },
        { text: 'Updates task priority automatically', icon: TrendingUp },
      ],
      stats: { time: '< 1 second', automation: '100%', frequency: 'Every 6 hours' },
    },
  ];

  const activeExampleData = automationExamples[activeExample];
  const ActiveIcon = activeExampleData.icon;

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">
              Intelligent Automation
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            FormaOS Automates Compliance Workflows
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            While you focus on your business, FormaOS monitors compliance 24/7, automatically
            creating tasks, sending alerts, and keeping your team on track
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          {/* Left: Automation Triggers */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Automation Triggers
            </h3>
            {automationExamples.map((example) => {
              const Icon = example.icon;
              const isActive = example.id === activeExample;
              const colorClasses = {
                blue: isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white',
                red: isActive ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white',
                purple: isActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white',
                orange: isActive ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white',
              }[example.color];

              return (
                <button
                  key={example.id}
                  onClick={() => setActiveExample(example.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${colorClasses} hover:shadow-md`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      example.color === 'blue'
                        ? 'bg-blue-100'
                        : example.color === 'red'
                          ? 'bg-red-100'
                          : example.color === 'purple'
                            ? 'bg-purple-100'
                            : 'bg-orange-100'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        example.color === 'blue'
                          ? 'text-blue-600'
                          : example.color === 'red'
                            ? 'text-red-600'
                            : example.color === 'purple'
                              ? 'text-purple-600'
                              : 'text-orange-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900">{example.trigger}</h4>
                    <p className="text-sm text-gray-600">{example.description}</p>
                  </div>
                  {isActive && (
                    <Zap className="w-5 h-5 text-purple-600 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Automation Actions */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    activeExampleData.color === 'blue'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : activeExampleData.color === 'red'
                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                        : activeExampleData.color === 'purple'
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                          : 'bg-gradient-to-br from-orange-500 to-orange-600'
                  } shadow-lg`}
                >
                  <ActiveIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {activeExampleData.trigger}
                  </h3>
                  <p className="text-sm text-gray-600">{activeExampleData.description}</p>
                </div>
              </div>

              {/* Automated Actions */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Automated Actions
                </h4>
                <div className="space-y-3">
                  {activeExampleData.actions.map((action, idx) => {
                    const ActionIcon = action.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <ActionIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900">{action.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {activeExampleData.stats.time}
                  </div>
                  <div className="text-xs text-gray-600">Execution Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {activeExampleData.stats.automation}
                  </div>
                  <div className="text-xs text-gray-600">Automated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {activeExampleData.stats.frequency}
                  </div>
                  <div className="text-xs text-gray-600">Check Frequency</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <a
              href="/app/signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Start Automating Compliance
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </a>
            <a
              href="/product"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-300 hover:border-purple-600 hover:text-purple-600 transition-all"
            >
              Learn More About Automation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
