'use client';

import { RouteErrorCard } from '@/components/ui/route-error-card';

export default function SubmitFormIdError({
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
      area="Form"
      title="This form could not be loaded"
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
