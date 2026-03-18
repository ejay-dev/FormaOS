import type { Metadata } from 'next';
import { siteUrl } from '@/lib/seo';
import IntegrationsPageContent from './IntegrationsPageContent';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Integrations - FormaOS',
  description:
    'FormaOS integrates with your existing tools - Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure, and more - to embed compliance into the workflows your team already uses.',
  alternates: { canonical: `${siteUrl}/integrations` },
  openGraph: {
    title: 'Integrations | FormaOS',
    description:
      'Connect FormaOS with Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure, and more.',
    type: 'website',
    url: `${siteUrl}/integrations`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Integrations | FormaOS',
    description:
      'Connect FormaOS with Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure, and more.',
  },
};

export default function IntegrationsPage() {
  return <IntegrationsPageContent />;
}
