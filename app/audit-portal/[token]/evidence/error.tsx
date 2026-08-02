'use client';

import { useParams } from 'next/navigation';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AuditPortalTokenEvidenceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ token: string }>();

  return (
    <RouteErrorCard
      error={error}
      reset={reset}
      area="Evidence"
      homeHref={params?.token ? `/audit-portal/${params.token}` : '/'}
      homeLabel="Back to portal overview"
    />
  );
}
