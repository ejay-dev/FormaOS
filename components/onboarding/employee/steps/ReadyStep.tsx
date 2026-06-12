'use client';

import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { IndustryContent } from '@/lib/onboarding/employee-journey';

interface ReadyStepProps {
  firstName: string;
  orgName: string;
  industryContent: IndustryContent;
  completeAction: (formData: FormData) => Promise<void>;
  skipAction: () => Promise<void>;
}

export function ReadyStep({
  firstName,
  orgName,
  industryContent,
  completeAction,
  skipAction,
}: ReadyStepProps) {
  const [completePending, setCompletePending] = useState(false);
  const [skipPending, setSkipPending] = useState(false);
  const { readyCTA } = industryContent;

  async function handleComplete(href: string) {
    if (completePending || skipPending) return;
    setCompletePending(true);
    try {
      const fd = new FormData();
      fd.append('primaryCTA', href);
      await completeAction(fd);
    } finally {
      setCompletePending(false);
    }
  }

  async function handleSkip() {
    if (completePending || skipPending) return;
    setSkipPending(true);
    try {
      await skipAction();
    } finally {
      setSkipPending(false);
    }
  }

  const busy = completePending || skipPending;

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Completion mark */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-success/10 border border-success/20 shadow-2xl">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-foreground tracking-tight">
          You&apos;re all set,{' '}
          <span className="text-foreground">
            {firstName}
          </span>
          .
        </h2>
        <p className="text-base text-muted-foreground max-w-sm">
          Welcome to{' '}
          <span className="text-foreground font-semibold">{orgName}</span>. Your
          account is active and your dashboard is ready.
        </p>
      </div>

      {/* Quick recap */}
      <div className="w-full max-w-sm rounded-2xl border border-edge-2 bg-surface-1 p-5 text-left space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          What&apos;s waiting for you
        </p>
        <div className="flex flex-col gap-2">
          {[
            'Your personalised compliance dashboard',
            'Tasks assigned to your account',
            'Access to your industry tools',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-success" />
              <span className="text-xs text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={() => handleComplete(readyCTA.primary.href)}
        disabled={busy}
        className="group flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-foreground px-6 py-4 text-sm font-bold text-background shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {completePending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Taking you there…
          </>
        ) : (
          <>
            {readyCTA.primary.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      {/* Secondary CTA */}
      <button
        onClick={() => handleComplete(readyCTA.secondary.href)}
        disabled={busy}
        className="group flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl border border-edge-2 bg-surface-1 px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-surface-2 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {readyCTA.secondary.label}
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Go to dashboard */}
      <button
        type="button"
        onClick={handleSkip}
        disabled={busy}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {skipPending ? 'Loading…' : 'Go straight to my dashboard'}
      </button>
    </div>
  );
}
