import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Our Story';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Our Story',
      subhead: 'Why FormaOS exists and how we are building a compliance operating system for regulated teams.',
    badges: ['Australia', 'Sydney HQ'],
    accent: 'violet',
  });
}
