import { PageSkeleton } from '@/components/ui/skeleton';

export default function VaultLoading() {
  return <PageSkeleton title="Evidence Vault" cards={2} tableRows={5} />;
}
