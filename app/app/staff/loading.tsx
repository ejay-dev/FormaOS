import { PageSkeleton } from '@/components/ui/skeleton';

export default function StaffLoading() {
  return <PageSkeleton title="Staff Dashboard" cards={4} tableRows={4} />;
}
