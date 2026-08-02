import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Our Story';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Our Story',
    subhead:
      'Why FormaOS exists, written by the engineer building it from Adelaide since 2022.',
    badges: ['Australia', 'Adelaide HQ'],
    accent: 'violet',
  });
}
