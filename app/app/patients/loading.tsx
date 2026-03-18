import { PageSkeleton } from '@/components/ui/skeleton';

export default function PatientsLoading() {
  return <PageSkeleton title="Participants" tableRows={5} />;
}
