import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppEvidenceGapsLoading() {
  return <PageSkeleton title="Evidence gaps" cards={2} tableRows={4} />;
}
