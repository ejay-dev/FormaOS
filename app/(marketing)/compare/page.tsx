import type { Metadata } from 'next';
import CompareIndexContent from './CompareIndexContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Compare',
  description:
    'Compare FormaOS against popular compliance automation tools. Outcome-driven execution, evidence defensibility, and operational governance.',
  alternates: {
    canonical: `${siteUrl}/compare`,
  },
  openGraph: {
    title: 'FormaOS | Compare',
    description:
      'Compare FormaOS against popular compliance automation tools. Outcome-driven execution, evidence defensibility, and operational governance.',
    type: 'website',
    url: `${siteUrl}/compare`,
  },
};

export default function CompareIndexPage() {
  return <CompareIndexContent />;
}
