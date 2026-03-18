import { PageSkeleton } from '@/components/ui/skeleton';

export default function RegistersLoading() {
  return <PageSkeleton title="Registers" cards={4} tableRows={0} />;
}
