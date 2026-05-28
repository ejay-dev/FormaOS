import type { Metadata } from 'next';
import { siteUrl } from '@/lib/seo';
import IntegrationsPageContent from './IntegrationsPageContent';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Integrations - FormaOS',
  description:
    'FormaOS ships with 6 live integrations today (Jira, Slack, Microsoft Teams, Microsoft Entra ID, Google Workspace, custom webhooks) and an extensible engine for the rest.',
  alternates: { canonical: `${siteUrl}/integrations` },
  openGraph: {
    title: 'Integrations | FormaOS',
    description:
      '6 live integrations (Jira, Slack, Microsoft Teams, Microsoft Entra ID, Google Workspace, custom webhooks) plus a roadmap of additional connectors.',
    type: 'website',
    url: `${siteUrl}/integrations`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Integrations | FormaOS',
    description:
      '6 live integrations (Jira, Slack, Microsoft Teams, Microsoft Entra ID, Google Workspace, custom webhooks) plus a roadmap of additional connectors.',
  },
};

export default function IntegrationsPage() {
  return <IntegrationsPageContent />;
}
