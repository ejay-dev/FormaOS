import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppIncidentsAnalyticsLoading() {
  return <PageSkeleton title="Incident analytics" cards={2} tableRows={4} />;
}
