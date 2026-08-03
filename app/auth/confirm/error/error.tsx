'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AuthConfirmErrorError({
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
      area="Confirmation"
      homeHref="/auth/signin"
      homeLabel="Back to sign in"
    />
  );
}
