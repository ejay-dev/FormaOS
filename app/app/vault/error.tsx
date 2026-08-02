'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AppVaultError({
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
      area="Evidence vault"
    />
  );
}
