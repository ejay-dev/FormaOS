import { PageSkeleton } from '@/components/ui/skeleton';

export default function IntegrationsLoading() {
  return <PageSkeleton title="Integration Control Plane" cards={3} tableRows={4} />;
}
