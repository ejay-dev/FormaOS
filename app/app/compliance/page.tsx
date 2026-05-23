import { Suspense } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { ObligationsTable } from '@/components/compliance/ObligationsTable';
import { CompliancePageHero } from '@/components/compliance/CompliancePageHero';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function ComplianceIndexPage() {
  return (
    <div className="flex flex-col h-full">
      <CompliancePageHero />

      {/*
       * Audit Sprint 7a (2026-05-24): surface the manual-attestation
       * workflow (Sprint 6c PR #173) from the compliance landing.
       * Per-industry sidebar navs (lib/navigation/industry-sidebar.ts)
       * are 9 separate arrays and not worth churning for a single
       * sub-link; the landing page is the natural hub.
       */}
      <Link
        href="/app/compliance/attestations"
        className="mx-4 mb-4 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 transition-colors hover:border-slate-700 hover:bg-slate-900 sm:mx-0"
      >
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-100">
              Manual attestations
            </p>
            <p className="text-xs text-slate-400">
              Controls whose evaluator requires a human sign-off.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-500" />
      </Link>

      <div className="flex-1 overflow-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Suspense fallback={<SkeletonCard className="h-96" />}>
          <ObligationsTable />
        </Suspense>
      </div>
    </div>
  );
}
