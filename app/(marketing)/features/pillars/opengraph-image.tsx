import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Features — 5 Pillars';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Platform Features',
    headline: 'Features — 5 Pillars',
      subhead: 'One OS for every obligation you owe. Compliance, evidence, tasks, care operations, and trust — governed end-to-end.',
    badges: ['25 features', '5 pillars'],
    accent: 'cyan',
  });
}
