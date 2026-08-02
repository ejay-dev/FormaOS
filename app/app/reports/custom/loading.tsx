import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppReportsCustomLoading() {
  return <PageSkeleton title="My reports" cards={2} tableRows={4} />;
}
