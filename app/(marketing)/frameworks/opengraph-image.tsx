import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - ISO, SOC 2, NDIS Framework Coverage';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Framework Coverage',
    headline: 'ISO, SOC 2, NDIS Framework Coverage',
      subhead: 'Framework-mapped controls and evidence workflows for ISO 27001, SOC 2, NDIS Practice Standards, and more. Build repeatable…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA', 'GDPR'],
    accent: 'cyan',
  });
}
