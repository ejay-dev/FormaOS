'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function StandaloneAuthRedirectError({
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
      title="This page could not be loaded"
      homeHref="/auth/signin"
      homeLabel="Back to sign in"
    />
  );
}
