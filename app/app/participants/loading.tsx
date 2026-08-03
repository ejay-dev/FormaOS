import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppParticipantsLoading() {
  return <PageSkeleton hero label="participants" heroMetrics={4} tableRows={5} />;
}
