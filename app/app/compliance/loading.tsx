import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppComplianceLoading() {
  return <PageSkeleton hero label="compliance" heroMetrics={4} cards={4} tableRows={5} />;
}
