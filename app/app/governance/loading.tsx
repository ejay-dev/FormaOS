import { PageSkeleton } from '@/components/ui/skeleton';

export default function GovernanceLoading() {
  return <PageSkeleton title="Governance Packs" cards={3} tableRows={0} />;
}
