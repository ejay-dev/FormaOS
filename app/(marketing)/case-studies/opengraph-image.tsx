import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Case Studies';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Company',
    headline: 'Case Studies',
      subhead: 'Representative FormaOS proof packs showing audit preparation, governed workflows, and evidence trails for regulated operators.',
    badges: ['Australia', 'Sydney HQ'],
    accent: 'violet',
  });
}
