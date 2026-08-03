'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AppSegmentError({
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
      area="App"
      title="This page could not be loaded"
    />
  );
}
