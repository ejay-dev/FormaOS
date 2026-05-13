import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Blog & Insights';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Blog & Insights',
      subhead: 'Expert insights on compliance management, regulatory technology, and operational excellence for regulated industries. Stay…',
    badges: ['Australia', 'Sydney HQ'],
    accent: 'violet',
  });
}
