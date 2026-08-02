'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AuthError({
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
      area="Authentication"
      title="This page could not be loaded"
      homeHref="/auth/signin"
      homeLabel="Back to sign in"
    />
  );
}
