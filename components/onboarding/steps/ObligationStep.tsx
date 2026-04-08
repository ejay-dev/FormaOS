'use client';

import { useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import type { OnboardingState } from '../OnboardingWizard';

const INDUSTRY_EXAMPLES: Record<string, { title: string; framework: string }> =
  {
    ndis: {
      title: 'NDIS Worker Screening \u2014 Review expiry dates',
      framework: 'NDIS Practice Standards',
    },
    healthcare: {
      title: 'AHPRA Registration \u2014 Verify all practitioners',
      framework: 'NSQHS Standards',
    },
    aged_care: {
      title: 'Aged Care Star Rating \u2014 Self assessment review',
      framework: 'Aged Care Quality Standards',
    },
    childcare: {
      title: 'WWC Cards \u2014 Audit expiry dates',
      framework: 'ACECQA NQF',
    },
    financial_services: {
      title: 'AFS Licence \u2014 Annual compliance certificate',
      framework: 'ASIC AFS',
    },
    construction: {
      title: 'WHS Induction \u2014 All site workers',
      framework: 'WHS Act',
    },
  };

interface ObligationStepProps {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ObligationStep({
  state,
  updateState,
  onNext,
  onBack,
}: ObligationStepProps) {
  const example =
    INDUSTRY_EXAMPLES[state.industry] ?? INDUSTRY_EXAMPLES['ndis'];
  const [title, setTitle] = useState(example.title);
  const [framework, setFramework] = useState(example.framework);
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(state.obligationCreated);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/v1/compliance/obligations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          framework,
          owner: owner || undefined,
          dueDate,
        }),
      });
      if (!res.ok) {
        console.warn('Obligation creation returned non-ok:', res.status);
      }
    } catch {
      console.warn('Obligation creation failed');
    }
    setCreated(true);
    setIsCreating(false);
    updateState({ obligationCreated: true });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Create your first obligation</h2>
        <p className="text-muted-foreground text-sm">
          We&apos;ve pre-filled an example for your industry. Customize it or
          use as-is.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Title</label>
          <div className="relative">
            <ClipboardList className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={created}
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wire-action)]/50 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Framework</label>
            <input
              type="text"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              disabled={created}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wire-action)]/50 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={created}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wire-action)]/50 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Owner (optional)
          </label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. Compliance Manager"
            disabled={created}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wire-action)]/50 disabled:opacity-60"
          />
        </div>
      </div>

      {created && (
        <div className="rounded-lg border border-[var(--wire-success)]/30 bg-[var(--wire-success)]/10 p-3 text-sm text-[var(--wire-success)]">
          Obligation created successfully!
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isCreating}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {created ? (
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
            onClick={handleCreate}
            disabled={isCreating || !title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--wire-action)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Obligation'}
          </button>
        )}
      </div>
    </div>
  );
}
