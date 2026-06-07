import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ListChecks,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import type {
  FirstSessionState,
  FirstSessionStep,
} from '@/lib/onboarding/first-session';

function progressMessage(completed: number, total: number) {
  if (completed === 0) return "Let's get you set up.";
  if (completed < total) return "You're getting set up.";
  return "You're fully set up.";
}

type StartHereCardProps = {
  state: FirstSessionState;
};

export function StartHereCard({ state }: StartHereCardProps) {
  const { steps, completed, total, progress, nextStep } = state;

  return (
    <section
      data-testid="start-here-card"
      className="rounded-2xl border border-edge-2 bg-card p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge-2 bg-surface-1">
            <ListChecks className="h-5 w-5 text-foreground/80" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Start here
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              Your first 5 actions in FormaOS
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Work through these in order — each step unlocks the next and shows
              up as real data across the app.
            </p>
          </div>
        </div>
        <div
          className="min-w-[180px]"
          data-testid="start-here-progress"
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className="text-muted-foreground tabular-nums"
              data-testid="start-here-progress-count"
            >
              {completed} of {total} completed
            </span>
            <span
              className="font-medium text-foreground tabular-nums"
              data-testid="start-here-progress-value"
            >
              {progress}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-1">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p
            className="mt-2 text-[11px] text-muted-foreground"
            data-testid="start-here-progress-message"
          >
            {progressMessage(completed, total)}
          </p>
        </div>
      </header>

      {nextStep ? (
        <Link
          href={nextStep.href}
          data-testid="start-here-next-cta"
          className="mt-5 inline-flex min-h-[44px] md:min-h-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Next: {nextStep.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <div
          className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-success/20 bg-success/10 p-4"
          data-testid="start-here-complete"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                You&apos;re fully set up.
              </p>
              <p className="text-xs text-muted-foreground">
                Ready for day-to-day compliance work.
              </p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              href="/app/incidents"
              data-testid="start-here-complete-incidents"
              className="inline-flex items-center gap-1.5 rounded-md border border-edge-2 bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40"
            >
              <TriangleAlert className="h-3.5 w-3.5 text-warning" />
              Manage incidents
            </Link>
            <Link
              href="/app/compliance"
              data-testid="start-here-complete-compliance"
              className="inline-flex items-center gap-1.5 rounded-md border border-edge-2 bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Review compliance
            </Link>
          </div>
        </div>
      )}

      <ol className="mt-6 space-y-2" data-testid="start-here-steps">
        {steps.map((step, index) => (
          <StepRow
            key={step.id}
            step={step}
            index={index + 1}
            isNext={!step.done && nextStep?.id === step.id}
          />
        ))}
      </ol>
    </section>
  );
}

function StepRow({
  step,
  index,
  isNext,
}: {
  step: FirstSessionStep;
  index: number;
  isNext: boolean;
}) {
  return (
    <li
      data-testid={`start-here-step-${step.id}`}
      data-done={step.done ? 'true' : 'false'}
      className={`flex items-start justify-between gap-3 rounded-xl border ${
        isNext ? 'border-primary/50 bg-primary/5' : 'border-edge-2 bg-surface-1'
      } p-3 transition-colors`}
    >
      <Link
        href={step.href}
        className="flex flex-1 items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        aria-label={`${step.done ? 'Completed' : 'Pending'}: ${step.label}`}
      >
        <div className="mt-0.5" role="img" aria-hidden="true">
          {step.done ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Circle
              className={`h-5 w-5 ${isNext ? 'text-primary' : 'text-muted-foreground/60'}`}
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Step {index}
            </span>
            {isNext && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Next
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {step.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {step.description}
          </p>
          {isNext && step.complianceNote ? (
            <p
              className="mt-1.5 text-[11px] leading-4 text-primary/80"
              data-testid={`start-here-compliance-${step.id}`}
            >
              <span className="font-semibold">Why this matters: </span>
              {step.complianceNote}
            </p>
          ) : null}
        </div>
      </Link>
      {!step.done && (
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60" />
      )}
    </li>
  );
}
