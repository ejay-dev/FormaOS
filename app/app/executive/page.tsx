import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ExecutiveDashboardClient } from './ExecutiveDashboardClient';
import { PageSkeleton } from '@/components/ui/skeleton';
import { fetchSystemState } from '@/lib/system-state/server';

export const metadata = {
  title: 'Executive Dashboard | FormaOS',
  description: 'C-level visibility into organization-wide compliance posture',
};

async function ExecutiveContent() {
  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/auth/login?next=/app/executive');
  }

  // Restrict to owner/admin
  if (systemState.role !== 'owner' && systemState.role !== 'admin') {
    redirect('/app?error=executive_access_required');
  }

  return (
    <ExecutiveDashboardClient
      organizationName={systemState.organization.name || 'Organization'}
      industry={systemState.organization.industry || null}
    />
  );
}

export default function ExecutiveDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Executive Dashboard" cards={4} tableRows={4} />}>
      <ExecutiveContent />
    </Suspense>
  );
}
