import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppParticipantsImportLoading() {
  return <PageSkeleton title="Import participants" cards={1} tableRows={0} />;
}
