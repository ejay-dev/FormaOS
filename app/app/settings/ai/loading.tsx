import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppSettingsAiLoading() {
  return <PageSkeleton title="AI settings" cards={2} tableRows={4} />;
}
