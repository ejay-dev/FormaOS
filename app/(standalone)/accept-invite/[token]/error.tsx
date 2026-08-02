'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function StandaloneAcceptInviteTokenError({
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
      area="Invitation"
      homeHref="/auth/signin"
      homeLabel="Back to sign in"
    />
  );
}
