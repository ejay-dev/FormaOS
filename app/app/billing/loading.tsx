import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppBillingLoading() {
  return <PageSkeleton hero label="billing" heroActions={2} cards={2} tableRows={0} />;
}
