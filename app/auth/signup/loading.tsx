import { PageSkeleton } from '@/components/ui/skeleton';

export default function AuthSignupLoading() {
  return <PageSkeleton title="Create account" cards={0} tableRows={5} />;
}
