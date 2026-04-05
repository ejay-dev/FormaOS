import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Gaps" cards={2} tableRows={4} />;
}
