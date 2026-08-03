import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppVisitsLoading() {
  return <PageSkeleton hero label="visits" heroMetrics={4} tableRows={5} />;
}
