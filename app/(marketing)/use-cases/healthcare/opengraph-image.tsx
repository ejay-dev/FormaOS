import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Healthcare Compliance Management';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Use Case',
    headline: 'Healthcare Compliance Management',
      subhead: 'Compliance solution for healthcare organizations. Manage policies, evidence, certificates, patient records, and incident…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'violet',
  });
}
