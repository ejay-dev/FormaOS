import { PageSkeleton } from '@/components/ui/skeleton';

export default function UnauthorizedLoading() {
  return <PageSkeleton title="Access denied" cards={0} tableRows={5} />;
}
