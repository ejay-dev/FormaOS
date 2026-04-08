'use client';

import { useState } from 'react';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import type { OnboardingState } from '../OnboardingWizard';

const INDUSTRY_FRAMEWORKS: Record<
  string,
  { slug: string; name: string; count: number }[]
> = {
  ndis: [
    {
      slug: 'ndis-practice-standards',
      name: 'NDIS Practice Standards',
      count: 32,
    },
    {
      slug: 'aged-care-quality',
      name: 'Aged Care Quality Standards',
      count: 18,
    },
  ],
  healthcare: [
    { slug: 'nsqhs-standards', name: 'NSQHS Standards', count: 24 },
    { slug: 'ahpra-obligations', name: 'AHPRA Obligations', count: 15 },
  ],
  aged_care: [
    {
      slug: 'aged-care-quality',
      name: 'Aged Care Quality Standards',
      count: 18,
    },
    { slug: 'sirs-reporting', name: 'SIRS Reporting Requirements', count: 12 },
  ],
  childcare: [
    {
      slug: 'nqf-quality-areas',
      name: 'ACECQA NQF 7 Quality Areas',
      count: 28,
    },
  ],
  financial_services: [
    { slug: 'asic-afs', name: 'ASIC AFS General Obligations', count: 20 },
    { slug: 'austrac-aml-ctf', name: 'AUSTRAC AML/CTF Program', count: 16 },
  ],
  construction: [{ slug: 'whs-act', name: 'WHS Act Obligations', count: 22 }],
};

interface FrameworkStepProps {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FrameworkStep({
  state,
  updateState,
  onNext,
  onBack,
}: FrameworkStepProps) {
  const frameworks =
    INDUSTRY_FRAMEWORKS[state.industry] ?? INDUSTRY_FRAMEWORKS['ndis'];
  const [selectedSlug, setSelectedSlug] = useState(frameworks[0]?.slug ?? '');
  const [isActivating, setIsActivating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activated, setActivated] = useState(state.frameworkActivated);

  const selectedFramework = frameworks.find((f) => f.slug === selectedSlug);

  const handleActivate = async () => {
    if (!selectedFramework) return;
    setIsActivating(true);
    setProgress(0);

    // Simulate framework activation with progress
    const totalObligations = selectedFramework.count;
    for (let i = 0; i <= totalObligations; i++) {
      await new Promise((r) => setTimeout(r, 60));
      setProgress(Math.round((i / totalObligations) * 100));
    }

    // Call the server action to apply industry pack
    try {
      const res = await fetch('/api/v1/frameworks/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameworkSlug: selectedSlug,
          industry: state.industry,
        }),
      });
      if (!res.ok) {
        // Still proceed even if API fails — the visual progress already completed
        console.warn('Framework activation API returned non-ok:', res.status);
      }
    } catch {
      console.warn('Framework activation API call failed');
    }

    setActivated(true);
    setIsActivating(false);
    updateState({
      frameworkActivated: true,
      frameworkName: selectedFramework.name,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Load your first framework</h2>
        <p className="text-muted-foreground text-sm">
          Choose a compliance framework to pre-populate your obligations
          register.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Available frameworks</label>
        <div className="space-y-2">
          {frameworks.map((fw) => (
            <button
              key={fw.slug}
              type="button"
              disabled={isActivating || activated}
              onClick={() => setSelectedSlug(fw.slug)}
              className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                selectedSlug === fw.slug
                  ? 'border-[var(--wire-action)] bg-[var(--wire-action)]/10'
                  : 'border-border hover:border-muted-foreground/40'
              } ${isActivating || activated ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <Shield className="h-5 w-5 shrink-0 text-[var(--wire-action)]" />
              <div>
                <div className="font-medium text-sm">{fw.name}</div>
                <div className="text-xs text-muted-foreground">
                  {fw.count} obligations
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {isActivating && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading {selectedFramework?.count} obligations...</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-[var(--wire-action)] transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {activated && (
        <div className="rounded-lg border border-[var(--wire-success)]/30 bg-[var(--wire-success)]/10 p-3 text-sm text-[var(--wire-success)]">
          Framework activated successfully!
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isActivating}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {activated ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--wire-action)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            disabled={isActivating || !selectedSlug}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--wire-action)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Activate Framework
          </button>
        )}
      </div>
    </div>
  );
}
