import { PageSkeleton } from '@/components/ui/skeleton';

export default function PoliciesLoading() {
  return <PageSkeleton title="Policies" cards={2} tableRows={5} />;
}
