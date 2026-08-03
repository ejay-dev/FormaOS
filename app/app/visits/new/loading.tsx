import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppVisitsNewLoading() {
  return <PageSkeleton title="Schedule visit" cards={2} tableRows={0} />;
}
