import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Revenue" cards={4} tableRows={5} />;
}
