import { PageSkeleton } from '@/components/ui/skeleton';

export default function CarePlansLoading() {
  return <PageSkeleton title="Care Plans" cards={3} tableRows={5} />;
}
