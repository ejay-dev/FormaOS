import { Suspense } from 'react';
import Link from 'next/link';
import { ShieldCheck, Layers, Table2 } from 'lucide-react';
import { ObligationsTable } from '@/components/compliance/ObligationsTable';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function ComplianceIndexPage() {
  return (
    <div className="space-y-6">
      {/* Header with tab navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Obligations Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track, manage, and prove compliance across all frameworks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/compliance/frameworks"
            className="rounded-lg border border-glass-border bg-glass-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-glass-strong transition-colors"
          >
            <Layers className="inline h-3 w-3 mr-1" />
            Frameworks
          </Link>
          <Link
            href="/app/compliance/cross-map"
            className="rounded-lg border border-glass-border bg-glass-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-glass-strong transition-colors"
          >
            <ShieldCheck className="inline h-3 w-3 mr-1" />
            Cross-Map
          </Link>
        </div>
      </div>

      {/* Primary obligations table view */}
      <Suspense fallback={<SkeletonCard className="h-96" />}>
        <ObligationsTable />
      </Suspense>
    </div>
  );
}
