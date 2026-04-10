'use client';

import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

type PipelineStep =
  | 'reported'
  | 'under_investigation'
  | 'regulator_notified'
  | 'closed';

const STEPS: { id: PipelineStep; label: string }[] = [
  { id: 'reported', label: 'Reported' },
  { id: 'under_investigation', label: 'Under Investigation' },
  { id: 'regulator_notified', label: 'Regulator Notified' },
  { id: 'closed', label: 'Closed' },
];

const STEP_INDEX: Record<PipelineStep, number> = {
  reported: 0,
  under_investigation: 1,
  regulator_notified: 2,
  closed: 3,
};

interface IncidentStatusPipelineProps {
  currentStep: PipelineStep;
  blockedStep?: PipelineStep;
}

function PipelineInner({
  currentStep,
  blockedStep,
}: IncidentStatusPipelineProps) {
  const currentIdx = STEP_INDEX[currentStep];

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isBlocked = step.id === blockedStep;
        const _isFuture = idx > currentIdx;

        let dotColor = 'border-glass-border text-muted-foreground/40';
        let lineColor = 'bg-glass-border';
        let labelColor = 'text-muted-foreground/60';

        if (isComplete) {
          dotColor =
            'border-[var(--wire-success)] bg-[var(--wire-success)]/15 text-[var(--wire-success)]';
          lineColor = 'bg-[var(--wire-success)]';
          labelColor = 'text-[var(--wire-success)]';
        } else if (isCurrent) {
          dotColor =
            'border-[var(--wire-action)] bg-[var(--wire-action)]/15 text-[var(--wire-action)] ring-2 ring-[var(--wire-action)]/20';
          labelColor = 'text-foreground font-semibold';
        }

        if (isBlocked) {
          dotColor =
            'border-[var(--wire-alert)] bg-[var(--wire-alert)]/15 text-[var(--wire-alert)]';
          labelColor = 'text-[var(--wire-alert)]';
        }

        return (
          <div key={step.id} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${dotColor}`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isBlocked ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-[10px] text-center leading-tight max-w-[80px] ${labelColor}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1 rounded-full transition-all ${isComplete ? lineColor : 'bg-glass-border'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Incident Status Pipeline — stepped progress for incident lifecycle.
 * Reported → Under Investigation → Regulator Notified → Closed
 */
export function IncidentStatusPipeline(props: IncidentStatusPipelineProps) {
  return (
    <ErrorBoundary name="IncidentStatusPipeline" level="component">
      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4">
        <PipelineInner {...props} />
      </div>
    </ErrorBoundary>
  );
}
