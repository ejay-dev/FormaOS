import { PageSkeleton } from '@/components/ui/skeleton';

export default function AuditLoading() {
  return <PageSkeleton title="Audit Log" tableRows={6} />;
}
