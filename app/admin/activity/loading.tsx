import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Activity" cards={4} tableRows={5} />;
}
