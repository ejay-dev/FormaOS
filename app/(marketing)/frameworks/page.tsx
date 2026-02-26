import type { Metadata } from 'next';
import FrameworksContent from './FrameworksContent';
import { breadcrumbSchema } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'ISO, SOC 2, NDIS Framework Coverage — FormaOS',
  description:
    'Framework-mapped controls and evidence workflows for ISO 27001, SOC 2, NDIS Practice Standards, and more. Build repeatable compliance execution, not static checklists.',
  alternates: {
    canonical: `${siteUrl}/frameworks`,
  },
  openGraph: {
    title: 'Framework Coverage | FormaOS',
    description:
      'Framework-mapped controls and evidence workflows. Build repeatable compliance execution, not static checklists.',
    type: 'website',
    url: `${siteUrl}/frameworks`,
  },
};

export default function FrameworksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Frameworks', path: '/frameworks' },
            ])
          ),
        }}
      />
      <FrameworksContent />
    </>
  );
}
