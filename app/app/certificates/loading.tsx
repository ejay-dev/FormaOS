import { PageSkeleton } from '@/components/ui/skeleton';

export default function CertificatesLoading() {
  return <PageSkeleton title="Certificates" cards={3} tableRows={5} />;
}
