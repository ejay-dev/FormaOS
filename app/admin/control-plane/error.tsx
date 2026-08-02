'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminControlPlaneError({
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
      area="Control plane"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
