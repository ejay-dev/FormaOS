import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - ISO Compliance Software - ISO 27001 Automation Platform';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Industry Platform',
    headline: 'ISO Compliance Software - ISO 27001 Automation Platform',
      subhead: 'Automate ISO 27001 compliance with FormaOS. Map controls to Annex A requirements, capture evidence continuously, and maintain…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'cyan',
  });
}
