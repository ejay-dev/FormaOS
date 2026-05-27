import { Suspense } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ArrowRight, Activity } from 'lucide-react';
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
       * Audit 2026-05-27 Tier 2.C: also surface the Health dashboard.
       */}
      <div className="mx-4 mb-4 grid gap-2 sm:mx-0 md:grid-cols-2">
        <Link
          href="/app/compliance/health"
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-card/60 px-4 py-3 transition-colors hover:border-slate-700 hover:bg-card"
          data-testid="compliance-health-link"
        >
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Compliance health
              </p>
              <p className="text-xs text-muted-foreground">
                Cross-framework score, status counts, top outstanding controls.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          href="/app/compliance/attestations"
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-card/60 px-4 py-3 transition-colors hover:border-slate-700 hover:bg-card"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Manual attestations
              </p>
              <p className="text-xs text-muted-foreground">
                Controls whose evaluator requires a human sign-off.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="flex-1 overflow-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Suspense fallback={<SkeletonCard className="h-96" />}>
          <ObligationsTable />
        </Suspense>
      </div>
    </div>
  );
}
