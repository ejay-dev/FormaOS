import { PageSkeleton } from '@/components/ui/skeleton';

export default function CertificatesLoading() {
  return <PageSkeleton title="Certificate renewals" cards={3} tableRows={5} />;
}
