import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Case Study Template';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Case Study Template',
      subhead: 'Buyer-grade case study template for regulated operators: before/after, mechanism, measurable metrics, and timeframe.',
    badges: ['Australia', 'Adelaide HQ'],
    accent: 'violet',
  });
}
