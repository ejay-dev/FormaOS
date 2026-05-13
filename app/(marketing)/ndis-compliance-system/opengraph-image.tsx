import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - NDIS Compliance System - Practice Standards & Quality Indicators';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Industry Platform',
    headline: 'NDIS Compliance System - Practice Standards & Quality Indicators',
      subhead: 'Purpose-built NDIS compliance system for disability service providers. Map Practice Standards, track Quality Indicators, manage…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'cyan',
  });
}
