import { PageSkeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return <PageSkeleton title="Settings" cards={3} tableRows={0} />;
}
