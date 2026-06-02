'use client';

// Thin client wrapper that binds the `markRegulatoryNotificationSubmitted`
// server action to the presentational RegulatoryNotificationTracker. Needed
// because the tracker takes an `onMarkSubmitted` function prop, which a Server
// Component page cannot pass across the boundary. This is a passthrough only —
// no new affordance beyond what the tracker already renders.
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

  return (
    <RegulatoryNotificationTracker
      notifications={notifications}
      incidentId={incidentId}
      onMarkSubmitted={async (id, referenceNumber) => {
        const result = await markRegulatoryNotificationSubmitted(
          id,
          referenceNumber,
          incidentId,
        );
        const ok = !!(result && 'success' in result && result.success);
        // Refresh on success; return the flag so the tracker keeps the
        // dialog open and surfaces an error on failure instead of silently
        // closing as if it worked.
        if (ok) router.refresh();
        return ok;
      }}
    />
  );
}
