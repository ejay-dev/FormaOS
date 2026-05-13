import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - API Documentation';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Resources',
    headline: 'API Documentation',
      subhead: 'Complete reference for the FormaOS v1 REST API. Bearer authentication, scoped API keys, rate limits, cursor pagination, webhooks,…',
    badges: ['v1 API', 'OpenAPI 3.1'],
    accent: 'violet',
  });
}
