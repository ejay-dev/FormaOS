import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppCarePlansJourneyLoading() {
  return <PageSkeleton title="Care plan journey" cards={3} tableRows={4} />;
}
