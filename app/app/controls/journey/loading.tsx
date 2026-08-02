import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppControlsJourneyLoading() {
  return <PageSkeleton title="Control journey" cards={3} tableRows={4} />;
}
