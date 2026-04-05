import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Bulk" cards={4} tableRows={5} />;
}
