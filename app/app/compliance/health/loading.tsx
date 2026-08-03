import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppComplianceHealthLoading() {
  return <PageSkeleton hero label="compliance health" cards={3} tableRows={0} />;
}
