import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppParticipantsNewLoading() {
  return <PageSkeleton title="Add participant" cards={2} tableRows={0} />;
}
