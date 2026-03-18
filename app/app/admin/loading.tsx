import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppAdminLoading() {
  return <PageSkeleton title="Admin Console" cards={3} tableRows={0} />;
}
