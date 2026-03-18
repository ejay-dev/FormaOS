import { PageSkeleton } from '@/components/ui/skeleton';

export default function ParticipantsLoading() {
  return <PageSkeleton title="Participants" tableRows={5} />;
}
