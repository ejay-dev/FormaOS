import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppRegistersLoading() {
  return <PageSkeleton hero label="registers" heroActions={2} cards={4} tableRows={0} />;
}
