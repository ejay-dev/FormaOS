import { PageSkeleton } from '@/components/ui/skeleton';

export default function ActivityLoading() {
  return <PageSkeleton title="Organization Activity Feed" cards={0} tableRows={6} />;
}
