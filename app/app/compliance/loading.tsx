import { PageSkeleton } from '@/components/ui/skeleton';

export default function ComplianceLoading() {
  return <PageSkeleton title="Compliance" cards={4} tableRows={5} />;
}
