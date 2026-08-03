import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppStaffComplianceLoading() {
  return <PageSkeleton hero label="staff compliance" heroMetrics={4} tableRows={5} />;
}
