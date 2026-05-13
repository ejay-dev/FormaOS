import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Integrations';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Integrations',
    headline: 'Integrations',
      subhead: 'FormaOS integrates with your existing tools - Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure, and more - to embed…',
    badges: ['Jira', 'Slack', 'GitHub', 'Azure'],
    accent: 'cyan',
  });
}
