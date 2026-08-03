import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppPoliciesLoading() {
  return <PageSkeleton hero label="policies" heroMetrics={3} cards={2} tableRows={5} />;
}
