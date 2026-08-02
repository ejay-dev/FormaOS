import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - SOC 2 Compliance Automation - Trust Services Criteria Platform';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Industry Platform',
    headline: 'SOC 2 Compliance Automation - Trust Services Criteria Platform',
      subhead: 'Automate SOC 2 compliance with FormaOS. Map Trust Services Criteria to operational controls, capture evidence continuously, and…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'cyan',
  });
}
