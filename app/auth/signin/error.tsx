'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AuthSigninError({
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
      area="Sign in"
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
