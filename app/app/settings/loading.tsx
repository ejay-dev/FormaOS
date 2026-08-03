import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppSettingsLoading() {
  return <PageSkeleton hero label="settings" heroMetrics={4} cards={3} tableRows={0} />;
}
