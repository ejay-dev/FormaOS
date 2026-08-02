'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminError({
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
      area="Admin console"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
