import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Privacy Policy';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Legal',
    headline: 'Privacy Policy',
      subhead: 'Privacy policy for the FormaOS enterprise compliance platform. We are committed to protecting your personal and organizational…',
    badges: ['GDPR', 'APP', 'DPA'],
    accent: 'amber',
  });
}
