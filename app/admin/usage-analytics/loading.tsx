import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Usage Analytics" cards={4} tableRows={5} />;
}
