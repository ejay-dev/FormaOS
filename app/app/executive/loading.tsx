import { PageSkeleton } from '@/components/ui/skeleton';

export default function ExecutiveLoading() {
  return <PageSkeleton title="Executive Dashboard" cards={4} tableRows={4} />;
}
