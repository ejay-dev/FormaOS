import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Pricing, Procurement, and Enterprise Review';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Pricing, Procurement, and Enterprise Review',
      subhead: 'Talk to FormaOS about plan fit, enterprise evaluation, procurement review, and rollout for regulated teams.',
    badges: ['Australia', 'Adelaide HQ'],
    accent: 'violet',
  });
}
