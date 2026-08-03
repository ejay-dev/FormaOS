import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppPatientsLoading() {
  return <PageSkeleton title="Patients" cards={0} tableRows={5} />;
}
