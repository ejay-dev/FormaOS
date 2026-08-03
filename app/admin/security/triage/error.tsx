'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminSecurityTriageError({
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
      area="Security triage"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
