import { PageSkeleton } from '@/components/ui/skeleton';

export default function EvidenceLoading() {
  return <PageSkeleton title="Evidence Vault" cards={2} tableRows={5} />;
}
