'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminUsageAnalyticsError({
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
      area="Usage analytics"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
