'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AdminUsersError({
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
      area="Users"
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
