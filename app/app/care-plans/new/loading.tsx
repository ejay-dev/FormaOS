import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppCarePlansNewLoading() {
  return <PageSkeleton title="New care plan" cards={2} tableRows={0} />;
}
