'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function WorkspaceRecoveryError({
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
      area="Workspace recovery"
      homeHref="/auth/signin"
      homeLabel="Back to sign in"
    />
  );
}
