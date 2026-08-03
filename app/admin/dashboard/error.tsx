'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminDashboardError({
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
      area="Admin dashboard"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
