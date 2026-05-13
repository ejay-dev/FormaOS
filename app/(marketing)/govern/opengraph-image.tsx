import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Govern Compliance';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Compliance OS',
    headline: 'Govern Compliance',
      subhead: 'Govern enterprise compliance with executive visibility, risk prioritization, and cross-workflow orchestration.',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'cyan',
  });
}
