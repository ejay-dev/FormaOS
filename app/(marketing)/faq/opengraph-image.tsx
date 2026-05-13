import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Frequently Asked Questions';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Resources',
    headline: 'Frequently Asked Questions',
      subhead: 'Get answers to common questions about FormaOS - security, audit trails, immutable evidence, ISO/SOC support, integrations,…',
    badges: ['v1 API', 'OpenAPI 3.1'],
    accent: 'violet',
  });
}
