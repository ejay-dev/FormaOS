import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Terms & Conditions';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Legal',
    headline: 'Terms & Conditions',
      subhead: 'Terms and conditions for the FormaOS enterprise compliance platform. The framework for responsible platform usage, data…',
    badges: ['GDPR', 'APP', 'DPA'],
    accent: 'amber',
  });
}
