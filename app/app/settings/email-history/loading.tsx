import { PageSkeleton } from '@/components/ui/skeleton';

export default function EmailHistoryLoading() {
  return <PageSkeleton title="Email Delivery History" cards={2} tableRows={6} />;
}
