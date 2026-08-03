'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function AppParticipantsEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorCard error={error} reset={reset} area="Edit participant" />;
}
