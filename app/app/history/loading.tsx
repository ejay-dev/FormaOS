import { PageSkeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return <PageSkeleton title="History" tableRows={6} />;
}
