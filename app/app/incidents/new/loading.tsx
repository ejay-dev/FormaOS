import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppIncidentsNewLoading() {
  return <PageSkeleton title="Report incident" cards={2} tableRows={0} />;
}
