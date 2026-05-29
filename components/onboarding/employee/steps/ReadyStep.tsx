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
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        {/* Ping rings */}
        <div className="absolute inset-0 rounded-3xl animate-ping opacity-10 bg-emerald-400" />
        <div className="absolute inset-0 rounded-3xl animate-ping animation-delay-300 opacity-5 bg-emerald-400" />
      </div>

      {/* Message */}
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-slate-100 tracking-tight">
          You&apos;re all set,{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            {firstName}
          </span>
          .
        </h2>
        <p className="text-base text-slate-400 max-w-sm">
          Welcome to{' '}
          <span className="text-slate-200 font-semibold">{orgName}</span>. Your
          account is active and your dashboard is ready.
        </p>
      </div>

      {/* Quick recap */}
      <div className="w-full max-w-sm rounded-2xl border border-edge-2 bg-surface-1 p-5 text-left space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          What&apos;s waiting for you
        </p>
        <div className="flex flex-col gap-2">
          {[
            'Your personalised compliance dashboard',
            'Tasks assigned to your account',
            'Access to your industry tools',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
              <span className="text-xs text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={() => handleComplete(readyCTA.primary.href)}
        disabled={busy}
        className="group flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
        className="group flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl border border-edge-2 bg-surface-1 px-6 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-surface-2 active:scale-[0.98] disabled:opacity-50"
      >
        {readyCTA.secondary.label}
        <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Go to dashboard */}
      <button
        type="button"
        onClick={handleSkip}
        disabled={busy}
        className="text-xs text-slate-500 underline-offset-2 hover:text-slate-400 hover:underline disabled:opacity-50"
      >
        {skipPending ? 'Loading…' : 'Go straight to my dashboard'}
      </button>
    </div>
  );
}
