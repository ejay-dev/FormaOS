import { PageSkeleton } from '@/components/ui/skeleton';

export default function TasksLoading() {
  return <PageSkeleton title="Compliance Roadmap" tableRows={6} />;
}
