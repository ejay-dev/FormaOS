/**
 * Walkthrough Overlay
 * Interactive step-by-step product tour with element highlighting
 */

'use client';

import { useEffect, useState } from 'react';
import { useDemo } from '@/lib/demo/demo-context';
import {
  TrendingUp,
  Zap,
  Shield,
  FileCheck,
  CheckCircle,
  FileText,
  X,
  ChevronRight,
  ChevronLeft,
  MousePointer2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WalkthroughStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  icon: React.ComponentType<{ className?: string }>;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  pointerPosition?: { x: number; y: number };
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 0,
    title: 'Compliance Health Score',
    description:
      'Your real-time compliance readiness score (0-100) calculated from controls, evidence, tasks, and policies. Updates automatically as your compliance posture changes.',
    targetSelector: '.compliance-score-widget',
    icon: TrendingUp,
    position: 'right',
  },
  {
    id: 1,
    title: 'Automation Timeline',
    description:
      'See FormaOS working automatically for you. Every automation event is logged here - tasks created, notifications sent, evidence reminders, and more.',
    targetSelector: '.automation-timeline',
    icon: Zap,
    position: 'top',
  },
  {
    id: 2,
    title: 'Evidence Vault',
    description:
      'Your compliance evidence repository. FormaOS automatically tracks expiry dates and creates renewal tasks when evidence ages beyond 90 days.',
    targetSelector: '.evidence-section',
    icon: FileCheck,
    position: 'right',
  },
  {
    id: 3,
    title: 'Task Automation',
    description:
      'Tasks are automatically generated based on compliance triggers. Overdue tasks trigger escalations. Recurring tasks auto-regenerate on completion.',
    targetSelector: '.tasks-section',
    icon: CheckCircle,
    position: 'right',
  },
  {
    id: 4,
    title: 'Policy Lifecycle',
    description:
      'Policies require periodic review (every 180 days). FormaOS automatically creates review tasks and notifies compliance officers when reviews are due.',
    targetSelector: '.policies-section',
    icon: FileText,
    position: 'right',
  },
  {
    id: 5,
    title: 'Controls & Reporting',
    description:
      'Monitor control health in real-time. When controls fail or become at-risk, FormaOS escalates to admins and creates remediation tasks automatically.',
    targetSelector: '.controls-section',
    icon: Shield,
    position: 'right',
  },
];

export function WalkthroughOverlay() {
  const { isWalkthroughActive, currentStep, totalSteps, nextStep, prevStep, skipWalkthrough } =
    useDemo();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentStepData = WALKTHROUGH_STEPS[currentStep];

  useEffect(() => {
    if (!isWalkthroughActive) {
      setHighlightedElement(null);
      return;
    }

    // Find and highlight target element
    const targetElement = document.querySelector(
      currentStepData.targetSelector
    ) as HTMLElement;

    if (targetElement) {
      setHighlightedElement(targetElement);

      // Calculate tooltip position
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (currentStepData.position) {
        case 'right':
          top = rect.top + scrollY + rect.height / 2 - 150;
          left = rect.right + scrollX + 20;
          break;
        case 'left':
          top = rect.top + scrollY + rect.height / 2 - 150;
          left = rect.left + scrollX - 420;
          break;
        case 'top':
          top = rect.top + scrollY - 320;
          left = rect.left + scrollX + rect.width / 2 - 200;
          break;
        case 'bottom':
          top = rect.bottom + scrollY + 20;
          left = rect.left + scrollX + rect.width / 2 - 200;
          break;
        case 'center':
          top = window.innerHeight / 2 - 150;
          left = window.innerWidth / 2 - 200;
          break;
      }

      const tooltipWidth = Math.min(400, window.innerWidth - 32);
      const tooltipHeight = 320;
      const minLeft = scrollX + 16;
      const maxLeft = scrollX + window.innerWidth - tooltipWidth - 16;
      const minTop = scrollY + 16;
      const maxTop = scrollY + window.innerHeight - tooltipHeight - 16;

      const clampedLeft = Math.min(Math.max(left, minLeft), maxLeft);
      const clampedTop = Math.min(Math.max(top, minTop), maxTop);

      setTooltipPosition({ top: clampedTop, left: clampedLeft });

      // Scroll element into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isWalkthroughActive, currentStep, currentStepData]);

  if (!isWalkthroughActive) return null;

  const Icon = currentStepData.icon;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] pointer-events-none">
        {/* Spotlight cutout for highlighted element */}
        {highlightedElement && (
          <div
            className="absolute border-4 border-purple-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-auto animate-pulse-glow"
            style={{
              top: highlightedElement.getBoundingClientRect().top + window.scrollY - 8,
              left: highlightedElement.getBoundingClientRect().left + window.scrollX - 8,
              width: highlightedElement.offsetWidth + 16,
              height: highlightedElement.offsetHeight + 16,
            }}
          />
        )}
      </div>

      {/* Animated pointer */}
      {highlightedElement && (
        <div
          className="fixed z-[101] pointer-events-none animate-bounce"
          style={{
            top: highlightedElement.getBoundingClientRect().top + window.scrollY - 40,
            left:
              highlightedElement.getBoundingClientRect().left +
              window.scrollX +
              highlightedElement.offsetWidth / 2 -
              12,
          }}
        >
          <MousePointer2 className="w-6 h-6 text-purple-400" />
        </div>
      )}

      {/* Tooltip card */}
      <Card
        className="fixed z-[102] w-[min(400px,calc(100vw-2rem))] p-6 bg-white border-2 border-purple-300 shadow-2xl pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {currentStepData.title}
              </h3>
              <p className="text-xs text-gray-500">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={skipWalkthrough}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-6">{currentStepData.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-purple-600'
                  : index < currentStep
                    ? 'w-2 bg-purple-300'
                    : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipWalkthrough}
            className="text-gray-600"
          >
            Skip Tour
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              onClick={nextStep}
              size="sm"
              className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
              {currentStep < totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
