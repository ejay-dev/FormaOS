'use client';

import { useState } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';
import type { OnboardingState } from '../OnboardingWizard';

const INDUSTRY_OPTIONS = [
  {
    id: 'ndis',
    label: 'NDIS Provider',
    frameworks: ['NDIS Practice Standards', 'Aged Care Quality Standards'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    frameworks: ['NSQHS Standards', 'AHPRA obligations'],
  },
  {
    id: 'aged_care',
    label: 'Aged Care',
    frameworks: ['Aged Care Quality Standards', 'SIRS Reporting'],
  },
  {
    id: 'childcare',
    label: 'Childcare',
    frameworks: ['ACECQA NQF 7 Quality Areas'],
  },
  {
    id: 'financial_services',
    label: 'Financial Services',
    frameworks: ['ASIC AFS obligations', 'AUSTRAC AML/CTF'],
  },
  {
    id: 'construction',
    label: 'Construction',
    frameworks: ['WHS Act obligations'],
  },
];

interface WelcomeStepProps {
  userName: string;
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onNext: () => void;
}

export function WelcomeStep({
  userName,
  state,
  updateState,
  onNext,
}: WelcomeStepProps) {
  const [selected, setSelected] = useState(state.industry);
  const match = INDUSTRY_OPTIONS.find((o) => o.id === selected);

  const handleContinue = () => {
    updateState({ industry: selected, industryConfirmed: true });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Welcome to FormaOS, {userName}</h2>
        <p className="text-muted-foreground text-sm">
          Let&apos;s get your compliance workspace ready in minutes.
        </p>
      </div>

      <div className="space-y-2">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-sm font-medium">Your industry</label>
        <div className="grid grid-cols-2 gap-2">
          {INDUSTRY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                selected === opt.id
                  ? 'border-[var(--wire-action)] bg-[var(--wire-action)]/10'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {match && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Pre-loaded frameworks for {match.label}:
          </p>
          <ul className="space-y-1">
            {match.frameworks.map((fw) => (
              <li key={fw} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--wire-success)]" />
                {fw}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--wire-action)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
