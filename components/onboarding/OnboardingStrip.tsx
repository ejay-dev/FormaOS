'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { useOnboarding } from '@/lib/onboarding/onboarding-context';

export function OnboardingStrip() {
  const { state, isActive } = useOnboarding();

  if (!isActive || !state || !state.nextStep) return null;

  const { completed, total, nextStep } = state;
  const stepIndex =
    state.steps.findIndex((s) => s.id === nextStep.id) + 1 || completed + 1;

  return (
    <div
      data-testid="onboarding-strip"
      className="border-b border-edge-2 bg-primary/5"
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-muted-foreground">
            Onboarding · Step {stepIndex} of {total}
          </span>
        </div>
        <span
          className="text-xs text-foreground/90"
          data-testid="onboarding-strip-label"
        >
          {nextStep.label}
        </span>
        <Link
          href={nextStep.href}
          data-testid="onboarding-strip-cta"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
