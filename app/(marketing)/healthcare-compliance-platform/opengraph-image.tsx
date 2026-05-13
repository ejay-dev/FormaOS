import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Healthcare Compliance Platform - Clinical Governance & Accreditation';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Industry Platform',
    headline: 'Healthcare Compliance Platform - Clinical Governance & Accreditation',
      subhead: 'Healthcare compliance platform for hospitals, clinics, and care providers. Manage NSQHS Standards, AHPRA requirements, clinical…',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'cyan',
  });
}
