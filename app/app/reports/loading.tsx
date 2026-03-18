import { PageSkeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return <PageSkeleton title="Reports Center" cards={4} tableRows={0} />;
}
