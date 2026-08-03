'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AppAuditError({
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
      area="Audit log"
    />
  );
}
