import { Suspense } from 'react';
import Link from 'next/link';
import { ShieldCheck, Layers, Table2 } from 'lucide-react';
import { ObligationsTable } from '@/components/compliance/ObligationsTable';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function ComplianceIndexPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Obligations Register</h1>
          <p className="page-description">
            Track, manage, and prove compliance across all frameworks
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/app/compliance/frameworks"
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            <Layers className="inline h-3 w-3 mr-1" />
            Frameworks
          </Link>
          <Link
            href="/app/compliance/cross-map"
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            <ShieldCheck className="inline h-3 w-3 mr-1" />
            Cross-Map
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Suspense fallback={<SkeletonCard className="h-96" />}>
          <ObligationsTable />
        </Suspense>
      </div>
    </div>
  );
}
