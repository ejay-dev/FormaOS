import { PageSkeleton } from '@/components/ui/skeleton';

export default function IncidentsLoading() {
  return <PageSkeleton title="Incidents" tableRows={5} />;
}
