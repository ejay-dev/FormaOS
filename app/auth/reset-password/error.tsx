'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AuthResetPasswordError({
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
      area="Password reset"
      homeHref="/auth/signin"
      homeLabel="Back to sign in"
    />
  );
}
