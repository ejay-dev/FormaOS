import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppComplianceAttestationsLoading() {
  return <PageSkeleton title="Attestations" cards={2} tableRows={6} />;
}
