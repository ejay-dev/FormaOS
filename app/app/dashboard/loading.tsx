import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Dashboard" cards={2} tableRows={4} />;
}
