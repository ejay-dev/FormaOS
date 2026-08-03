'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function StandaloneOrganizationOrgIdAuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      error={error}
      reset={reset}
      fullHeight
      area="Audit log"
    />
  );
}
