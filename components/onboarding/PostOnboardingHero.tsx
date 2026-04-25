import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
} from 'lucide-react';

import type { FirstSessionState } from '@/lib/onboarding/first-session';

type PostOnboardingHeroProps = {
  state: FirstSessionState;
};

/**
 * Rendered on /app once the 5 first-session steps are complete but the org
 * hasn't yet started doing the broader compliance work. Bridges the gap
 * between "setup is done" and "what should I do next?".
 */
export function PostOnboardingHero({ state }: PostOnboardingHeroProps) {
  if (state.total === 0) return null;
  if (state.completed < state.total) return null;

  return (
    <section
      data-testid="post-onboarding-hero"
      className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Setup complete
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              You&apos;re ready to run compliance.
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              The five foundations are in place. Pick the next thread that
              maps to how your team already works.
            </p>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          href="/app/incidents"
          data-testid="post-onboarding-cta-incidents"
          className="group flex items-start gap-3 rounded-xl border border-edge-2 bg-surface-1 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
            <TriangleAlert className="h-4 w-4 text-amber-500" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                Manage your first incident
              </p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Turn an event into a CAPA in minutes — the audit trail everyone
              will ask about.
            </p>
          </div>
        </Link>

        <Link
          href="/app/staff-compliance"
          data-testid="post-onboarding-cta-staff"
          className="group flex items-start gap-3 rounded-xl border border-edge-2 bg-surface-1 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <UserCheck className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                Set up staff compliance
              </p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Onboard credentials and training so expiring certs surface as
              tasks, not surprises.
            </p>
          </div>
        </Link>

        <Link
          href="/app/compliance"
          data-testid="post-onboarding-cta-compliance"
          className="group flex items-start gap-3 rounded-xl border border-edge-2 bg-surface-1 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                Review your compliance posture
              </p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              See which framework obligations are covered and where the gaps
              are right now.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
