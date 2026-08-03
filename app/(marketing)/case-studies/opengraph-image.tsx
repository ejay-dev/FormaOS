import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Case Studies';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Case Studies',
    subhead:
      'No customer case studies published yet. The structure each one will follow, and what a buyer can review in the meantime.',
    badges: ['Australia', 'Adelaide HQ'],
    accent: 'violet',
  });
}
