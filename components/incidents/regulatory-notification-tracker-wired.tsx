'use client';

// Thin client wrapper that binds the `markRegulatoryNotificationSubmitted`
// server action to the presentational RegulatoryNotificationTracker. Needed
// because the tracker takes an `onMarkSubmitted` function prop, which a Server
// Component page cannot pass across the boundary. This is a passthrough only —
// no new affordance beyond what the tracker already renders.
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryNotificationTracker } from './regulatory-notification-tracker';
import { markRegulatoryNotificationSubmitted } from '@/app/app/actions/care-operations';

type Notification = Parameters<
  typeof RegulatoryNotificationTracker
>[0]['notifications'][number];

export function RegulatoryNotificationTrackerWired({
  notifications,
  incidentId,
}: {
  notifications: Notification[];
  incidentId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <RegulatoryNotificationTracker
      notifications={notifications}
      incidentId={incidentId}
      onMarkSubmitted={(id, referenceNumber) => {
        startTransition(async () => {
          const result = await markRegulatoryNotificationSubmitted(
            id,
            referenceNumber,
            incidentId,
          );
          if (result && 'success' in result && result.success) {
            router.refresh();
          }
        });
      }}
    />
  );
}
