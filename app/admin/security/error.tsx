'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminSecurityError({
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
      area="Security"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
