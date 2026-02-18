import { PageSkeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return <PageSkeleton title="Profile" cards={2} tableRows={0} />;
}
