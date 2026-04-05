import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Marketplace" cards={2} tableRows={4} />;
}
