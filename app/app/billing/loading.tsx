import { PageSkeleton } from '@/components/ui/skeleton';

export default function BillingLoading() {
  return <PageSkeleton title="Billing" cards={2} tableRows={0} />;
}
