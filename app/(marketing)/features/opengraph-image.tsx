import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Platform Features';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Platform Features',
    headline: 'Platform Features',
      subhead: 'Every feature inside FormaOS: framework packs, compliance gate enforcement, SHA-256 evidence verification, workflow automation,…',
    badges: ['25 features', '5 pillars'],
    accent: 'cyan',
  });
}
