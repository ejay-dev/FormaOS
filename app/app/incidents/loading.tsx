import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppIncidentsLoading() {
  return <PageSkeleton hero label="incidents" heroMetrics={5} tableRows={5} />;
}
