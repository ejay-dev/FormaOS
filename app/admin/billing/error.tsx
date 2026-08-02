'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminBillingError({
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
      area="Billing"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
