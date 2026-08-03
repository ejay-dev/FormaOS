import { PageSkeleton } from '@/components/ui/skeleton';

export default function AppProfileLoading() {
  return <PageSkeleton hero label="your profile" heroActions={2} cards={2} tableRows={0} />;
}
