'use client';

// Client island that binds the saveInvestigationAnalysis server action to the
// presentational InvestigationForm (whose onSave takes an in-memory object,
// not FormData, so a Server Component page cannot wire it directly).
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvestigationForm } from './investigation-form';
import { saveInvestigationAnalysis } from '@/app/app/actions/incident-investigations';

type Methodology =
  | '5_whys'
  | 'fishbone'
  | 'timeline_analysis'
  | 'barrier_analysis';

type InitialData = {
  rootCause?: string;
  contributingFactors?: string[];
  whys?: string[];
  fishbone?: Record<string, string[]>;
  timeline?: Array<{ time: string; event: string }>;
  barriers?: Array<{ barrier: string; status: string }>;
};

export function InvestigationAnalysisPanel({
  incidentId,
  methodology,
  initialData,
}: {
  incidentId: string;
  methodology: Methodology;
  initialData?: InitialData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <InvestigationForm
        methodology={methodology}
        initialData={initialData}
        onSave={(data) => {
          setSaved(false);
          setError(null);
          startTransition(async () => {
            const result = await saveInvestigationAnalysis(
              incidentId,
              data as InitialData,
            );
            if (result && 'success' in result && result.success) {
              setSaved(true);
              router.refresh();
            } else {
              setError('Could not save the analysis. Please try again.');
            }
          });
        }}
      />
      {isPending && (
        <p className="text-xs text-muted-foreground">Saving analysis…</p>
      )}
      {saved && !isPending && (
        <p className="text-xs text-emerald-500">Analysis saved.</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
