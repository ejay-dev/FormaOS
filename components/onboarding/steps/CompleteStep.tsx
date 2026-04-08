'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Rocket } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app';
import type { OnboardingState } from '../OnboardingWizard';

interface CompleteStepProps {
  state: OnboardingState;
}

export function CompleteStep({ state }: CompleteStepProps) {
  const router = useRouter();
  const organization = useAppStore((s) => s.organization);
  const hydrate = useAppStore((s) => s.hydrate);
  const appState = useAppStore.getState();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleGoDashboard = async () => {
    setIsCompleting(true);
    try {
      // Mark onboarding as complete in Supabase
      const res = await fetch('/api/v1/organizations/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        console.warn('Onboarding complete API returned non-ok:', res.status);
      }
    } catch {
      console.warn('Onboarding complete API call failed');
    }

    // Update local state
    if (organization) {
      hydrate({
        user: appState.user,
        organization: { ...organization, onboardingCompleted: true },
        role: appState.role,
        isFounder: appState.isFounder,
        entitlements: appState.entitlements,
      });
    }

    router.push('/app');
    router.refresh();
  };

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--wire-success)]/20 flex items-center justify-center">
          <Rocket className="h-8 w-8 text-[var(--wire-success)]" />
        </div>
        <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground text-sm">
          Your compliance workspace is ready to go.
        </p>
      </div>

      <div className="space-y-3 text-left max-w-sm mx-auto">
        <SummaryItem
          done={state.industryConfirmed}
          label="Industry confirmed"
        />
        <SummaryItem
          done={state.frameworkActivated}
          label={
            state.frameworkName
              ? `${state.frameworkName} activated`
              : 'Framework activated'
          }
        />
        <SummaryItem
          done={state.obligationCreated}
          label="First obligation created"
        />
        <SummaryItem
          done={state.teamInvited}
          label={
            state.inviteCount > 0
              ? `${state.inviteCount} team member${state.inviteCount > 1 ? 's' : ''} invited`
              : 'Team invite skipped'
          }
        />
      </div>

      <button
        type="button"
        onClick={handleGoDashboard}
        disabled={isCompleting}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--wire-action)] px-8 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isCompleting ? 'Setting up...' : 'Go to Dashboard'}
      </button>
    </div>
  );
}

function SummaryItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2
        className={`h-5 w-5 shrink-0 ${
          done ? 'text-[var(--wire-success)]' : 'text-muted-foreground/40'
        }`}
      />
      <span className={`text-sm ${done ? '' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
