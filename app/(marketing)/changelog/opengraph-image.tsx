import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Compliance Infrastructure Product Updates';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Resources',
    headline: 'Compliance Infrastructure Product Updates',
      subhead: 'Latest FormaOS product updates across compliance workflows, audit readiness, evidence management, onboarding, care operations,…',
    badges: ['v1 API', 'OpenAPI 3.1'],
    accent: 'violet',
  });
}
