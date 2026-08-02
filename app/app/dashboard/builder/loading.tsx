import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppDashboardBuilderLoading() {
  return <PageSkeleton title="Dashboard builder" cards={2} tableRows={4} />;
}
