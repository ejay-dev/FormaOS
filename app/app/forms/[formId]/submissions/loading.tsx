import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Submissions" cards={2} tableRows={4} />;
}
