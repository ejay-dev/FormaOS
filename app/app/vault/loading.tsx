import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppVaultLoading() {
  return <PageSkeleton hero label="the evidence vault" heroMetrics={4} cards={2} tableRows={5} />;
}
