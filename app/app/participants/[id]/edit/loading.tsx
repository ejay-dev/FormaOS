import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppParticipantsEditLoading() {
  return <PageSkeleton title="Edit participant" cards={2} tableRows={0} />;
}
