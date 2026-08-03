import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppTeamLoading() {
  return <PageSkeleton hero label="the team" heroMetrics={3} tableRows={4} />;
}
