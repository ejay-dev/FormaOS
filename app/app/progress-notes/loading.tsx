import { PageSkeleton } from '@/components/ui/skeleton';

export default function ProgressNotesLoading() {
  return <PageSkeleton title="Progress Notes" tableRows={5} />;
}
