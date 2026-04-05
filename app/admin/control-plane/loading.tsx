import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton title="Control Plane" cards={4} tableRows={5} />;
}
