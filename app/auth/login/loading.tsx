import { PageSkeleton } from '@/components/ui/skeleton';

export default function AuthLoginLoading() {
  return <PageSkeleton title="Sign in" cards={0} tableRows={5} />;
}
