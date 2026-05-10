import { Font } from '@react-pdf/renderer';

const FONTSOURCE_BASE = 'https://cdn.jsdelivr.net/npm/@fontsource';
const INTER_VERSION = '5.0.16';
const SORA_VERSION = '5.0.20';

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: `${FONTSOURCE_BASE}/inter@${INTER_VERSION}/files/inter-latin-400-normal.woff`,
        fontWeight: 400,
      },
      {
        src: `${FONTSOURCE_BASE}/inter@${INTER_VERSION}/files/inter-latin-500-normal.woff`,
        fontWeight: 500,
      },
      {
        src: `${FONTSOURCE_BASE}/inter@${INTER_VERSION}/files/inter-latin-600-normal.woff`,
        fontWeight: 600,
      },
      {
        src: `${FONTSOURCE_BASE}/inter@${INTER_VERSION}/files/inter-latin-700-normal.woff`,
        fontWeight: 700,
      },
    ],
  });

  Font.register({
    family: 'Sora',
    fonts: [
      {
        src: `${FONTSOURCE_BASE}/sora@${SORA_VERSION}/files/sora-latin-600-normal.woff`,
        fontWeight: 600,
      },
      {
        src: `${FONTSOURCE_BASE}/sora@${SORA_VERSION}/files/sora-latin-700-normal.woff`,
        fontWeight: 700,
      },
      {
        src: `${FONTSOURCE_BASE}/sora@${SORA_VERSION}/files/sora-latin-800-normal.woff`,
        fontWeight: 800,
      },
    ],
  });
}
