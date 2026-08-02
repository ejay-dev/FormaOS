import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppSettingsAuditorAccessLoading() {
  return <PageSkeleton title="Auditor access" cards={2} tableRows={4} />;
}
