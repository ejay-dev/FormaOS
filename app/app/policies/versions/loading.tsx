import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppPoliciesVersionsLoading() {
  return <PageSkeleton title="Policy versions" cards={0} tableRows={6} />;
}
