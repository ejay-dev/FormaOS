import { Suspense } from 'react';
import { ObligationsTable } from '@/components/compliance/ObligationsTable';
import { CompliancePageHero } from '@/components/compliance/CompliancePageHero';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function ComplianceIndexPage() {
  return (
    <div className="flex flex-col h-full">
      <CompliancePageHero />

      <div className="flex-1 overflow-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Suspense fallback={<SkeletonCard className="h-96" />}>
          <ObligationsTable />
        </Suspense>
      </div>
    </div>
  );
}
