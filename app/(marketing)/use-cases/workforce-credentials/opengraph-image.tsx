import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Workforce Credential Management';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Use Case',
    headline: 'Workforce Credential Management',
      subhead: 'Credential tracking for workforce compliance with reminders, competency management, and audit-ready reporting.',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'violet',
  });
}
