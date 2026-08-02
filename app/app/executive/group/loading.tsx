import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppExecutiveGroupLoading() {
  return <PageSkeleton title="Group rollup" cards={2} tableRows={4} />;
}
