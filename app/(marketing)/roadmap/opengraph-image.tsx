import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Product Roadmap';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Resources',
    headline: 'Product Roadmap',
    subhead: "See what we're building next at FormaOS. Public roadmap covering upcoming features and framework coverage.",
    badges: ['v1 API', 'OpenAPI 3.1'],
    accent: 'violet',
  });
}
