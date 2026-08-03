'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function JoinError({
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
      fullHeight
      area="Join"
      title="This page could not be loaded"
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
