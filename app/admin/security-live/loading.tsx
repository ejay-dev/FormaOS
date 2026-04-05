import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Security Live" cards={4} tableRows={5} />;
}
