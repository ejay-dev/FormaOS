import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppReportsLoading() {
  return <PageSkeleton hero label="reports" heroActions={2} cards={4} tableRows={0} />;
}
