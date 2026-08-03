'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function RootError({
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
      area="App"
      title="Something went wrong"
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
