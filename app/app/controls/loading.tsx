import { PageSkeleton } from '@/components/ui/skeleton';

export default function ControlsLoading() {
  return <PageSkeleton title="Controls" cards={3} tableRows={8} />;
}
