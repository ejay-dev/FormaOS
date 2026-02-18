import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return <PageSkeleton title="Dashboard" cards={4} tableRows={4} />;
}
