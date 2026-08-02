'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminTrialsError({
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
      area="Trials"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
