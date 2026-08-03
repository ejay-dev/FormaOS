'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminSessionsError({
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
      area="Sessions"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
