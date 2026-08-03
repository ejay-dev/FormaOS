'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AuthLoginError({
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
      area="Sign in"
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
