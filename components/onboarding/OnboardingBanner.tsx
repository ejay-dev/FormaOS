'use client';

import { ArrowRight, ListChecks } from 'lucide-react';

import { useOnboarding } from '@/lib/onboarding/onboarding-context';
import type { FirstSessionStepId } from '@/lib/onboarding/first-session';

type OnboardingBannerProps = {
  stepId: FirstSessionStepId;
  /** id of the element to scroll to when the banner CTA is clicked. */
  scrollTargetId?: string;
  /** optional override CTA label. */
  ctaLabel?: string;
};

export function OnboardingBanner({
  stepId,
  scrollTargetId,
  ctaLabel = 'Do it now',
}: OnboardingBannerProps) {
  const { state, isActive, nextStepId } = useOnboarding();
  if (!isActive || !state) return null;
  if (nextStepId !== stepId) return null;
  const step = state.steps.find((s) => s.id === stepId);
  if (!step) return null;

  const handleClick = () => {
    if (!scrollTargetId) return;
    const el = document.getElementById(scrollTargetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const focusable = el.querySelector<HTMLElement>(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }
  };

  return (
    <div
      data-testid="onboarding-banner"
      data-step={stepId}
      className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-primary">
            Next step
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {step.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {step.description}
          </p>
        </div>
      </div>
      {scrollTargetId ? (
        <button
          type="button"
          onClick={handleClick}
          data-testid="onboarding-banner-cta"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
