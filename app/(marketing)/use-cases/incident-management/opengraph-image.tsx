import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Incident Management & Investigation';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Use Case',
    headline: 'Incident Management & Investigation',
      subhead: 'Incident reporting and investigation workflows with corrective actions, audit trails, and configurable regulator templates.',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'violet',
  });
}
