import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Customer Health" cards={4} tableRows={5} />;
}
