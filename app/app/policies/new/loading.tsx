import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppPoliciesNewLoading() {
  return <PageSkeleton title="Create policy" cards={2} tableRows={0} />;
}
