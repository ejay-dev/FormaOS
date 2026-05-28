import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Customer Stories - Compliance Operations in Practice';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Customer Stories - Compliance Operations in Practice',
      subhead: 'See how regulated operators use FormaOS to govern controls, evidence, and audit readiness in healthcare, NDIS, aged care, and…',
    badges: ['Australia', 'Adelaide HQ'],
    accent: 'violet',
  });
}
