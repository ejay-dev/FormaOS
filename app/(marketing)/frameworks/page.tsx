import type { Metadata } from 'next';
import FrameworksContent from './FrameworksContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Framework Coverage',
  description:
    'Framework-mapped controls and evidence workflows. Build repeatable compliance execution, not static checklists.',
  alternates: {
    canonical: `${siteUrl}/frameworks`,
  },
  openGraph: {
    title: 'FormaOS | Framework Coverage',
    description:
      'Framework-mapped controls and evidence workflows. Build repeatable compliance execution, not static checklists.',
    type: 'website',
    url: `${siteUrl}/frameworks`,
  },
};

export default function FrameworksPage() {
  return <FrameworksContent />;
}
