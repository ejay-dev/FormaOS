import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Government & Public Sector Governance';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Use Case',
    headline: 'Government & Public Sector Governance',
      subhead: 'Operational governance workflows for government and public sector teams managing approvals, evidence, records, and defensible…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'violet',
  });
}
