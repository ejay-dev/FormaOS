'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Compass, X } from 'lucide-react';

import { useOnboarding } from '@/lib/onboarding/onboarding-context';

const SESSION_DISMISS_KEY = 'formaos:onboarding-guide-dismissed';

function getSessionDismissed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

function setSessionDismissed() {
  try {
    window.sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
  } catch {
    // Local state still hides the guide for this render tree if storage is unavailable.
  }
}

/**
 * Client-side "guidance middleware": when the user opens a page that isn't
 * part of the current onboarding step's section, surface a non-blocking
 * notification nudging them back to the next step. Dismissal is scoped to the
 * current browser tab session so route remounts do not bring the guide back.
 */
export function OnboardingGuide() {
  const pathname = usePathname();
  const { state, isActive } = useOnboarding();
  const [dismissedForSession, setDismissedForSession] = useState(getSessionDismissed);

  const nextStep = state?.nextStep ?? null;

  const dismissForSession = () => {
    setDismissedForSession(true);
    setSessionDismissed();
  };

  const onTrack = useMemo(() => {
    if (!nextStep) return true;
    if (pathname === '/app') return true;
    const base = nextStep.basePath;
    if (pathname === base) return true;
    if (pathname.startsWith(`${base}/`)) return true;
    return false;
  }, [pathname, nextStep]);

  if (!isActive || !nextStep) return null;
  if (onTrack) return null;
  if (dismissedForSession) return null;

  return (
    <div
      data-testid="onboarding-guide"
      className="pointer-events-none fixed right-6 top-24 z-[55] w-[320px] hidden md:block"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-xl border border-primary/30 bg-popover p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Compass className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Onboarding in progress
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              Your next step is waiting
            </p>
            <p
              className="mt-1 text-xs text-muted-foreground"
              data-testid="onboarding-guide-step-label"
            >
              {nextStep.label}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissForSession}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dismiss guidance for this session"
            data-testid="onboarding-guide-dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={nextStep.href}
            data-testid="onboarding-guide-cta"
            className="inline-flex min-h-[44px] md:min-h-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={dismissForSession}
          >
            Take me there
          </Link>
          <button
            type="button"
            onClick={dismissForSession}
            className="inline-flex min-h-[44px] md:min-h-0 items-center gap-1.5 rounded-md border border-edge-2 bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="onboarding-guide-later"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
