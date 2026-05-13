import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - NDIS & Aged Care Compliance';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Use Case',
    headline: 'NDIS & Aged Care Compliance',
      subhead: 'Compliance management for NDIS providers and aged care facilities. Support worker screening records, incident workflows, and…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'violet',
  });
}
