import { PageSkeleton } from '@/components/ui/skeleton';

export default function PeopleLoading() {
  return <PageSkeleton title="Personnel Oversight" cards={3} tableRows={5} />;
}
