import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppSegmentLoading() {
  return <PageSkeleton cards={4} tableRows={4} />;
}
