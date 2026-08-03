'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminCustomerHealthError({
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
      area="Customer health"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
