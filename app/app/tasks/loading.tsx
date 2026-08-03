import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppTasksLoading() {
  return <PageSkeleton hero label="tasks" heroMetrics={4} tableRows={6} />;
}
