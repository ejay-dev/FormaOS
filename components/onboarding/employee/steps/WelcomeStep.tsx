'use client';

import { Building2, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  firstName: string;
  orgName: string;
  industryLabel: string;
  roleLabel: string;
  onNext: () => void;
}

export function WelcomeStep({
  firstName,
  orgName,
  industryLabel,
  roleLabel,
  onNext,
}: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Avatar / Greeting Icon */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-card border border-border shadow-2xl">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-success shadow-lg">
          <span className="text-xs text-success-foreground font-bold">✓</span>
        </div>
      </div>

      {/* Greeting */}
      <div className="space-y-3">
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          Welcome,{' '}
          <span className="text-foreground">
            {firstName}
          </span>
          .
        </h1>
        <p className="text-lg text-muted-foreground font-medium max-w-sm">
          You have been added to the{' '}
          <span className="text-foreground font-semibold">{orgName}</span> team
          on FormaOS.
        </p>
      </div>

      {/* Context cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        <div className="rounded-2xl border border-edge-2 bg-surface-1 px-4 py-3 text-left space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Your industry
          </p>
          <p className="text-sm font-semibold text-foreground">
            {industryLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-edge-2 bg-surface-1 px-4 py-3 text-left space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Your role
          </p>
          <p className="text-sm font-semibold text-foreground">{roleLabel}</p>
        </div>
      </div>

      {/* What to expect */}
      <div className="w-full max-w-sm rounded-2xl border border-edge-2 bg-card p-5 text-left space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            This takes 3 minutes
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          We will show you why compliance matters for your role, walk you
          through the tools you will use every day, and get your profile set up.
        </p>
        <div className="flex flex-col gap-1.5 pt-1">
          {['Why your work matters', 'Your daily tools', 'Your profile'].map(
            (item, i) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-[10px] font-bold text-foreground tabular-nums">
                  {i + 1}
                </div>
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ),
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="group flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-foreground px-6 py-4 text-sm font-bold text-background shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Let&apos;s go
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
