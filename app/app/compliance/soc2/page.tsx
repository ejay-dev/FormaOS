import { Suspense } from 'react';
import { getCurrentOrgId } from '@/lib/frameworks/org-frameworks';
import { getSoc2DashboardData } from '@/app/app/actions/soc2-readiness';
import { Soc2Dashboard } from '@/components/soc2/Soc2Dashboard';
import { SkeletonCard } from '@/components/ui/skeleton';

async function Soc2DashboardLoader() {
  const data = await getSoc2DashboardData();

  return (
    <Soc2Dashboard
      assessment={data.assessment}
      milestones={data.milestones}
      remediationActions={data.remediationActions}
      automatedChecks={data.automatedChecks}
    />
  );
}

export default async function Soc2ReadinessPage() {
  // Ensure org context exists
  await getCurrentOrgId();

  return (
    <Suspense
      fallback={
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 w-96 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <SkeletonCard className="h-64 w-64" />
            <SkeletonCard className="h-64" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonCard className="h-72" />
            <SkeletonCard className="h-72" />
          </div>
          <SkeletonCard className="h-96" />
        </div>
      }
    >
      <Soc2DashboardLoader />
    </Suspense>
  );
}
