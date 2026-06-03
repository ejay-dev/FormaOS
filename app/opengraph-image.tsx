import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FormaOS — Compliance Operating System for Regulated Industries';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0f1c',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Logo row */}
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1C1E1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="82.96 -2.19 299 299" fill="#ffffff">
              <polygon points="115.99,156.33 186.28,156.33 186.28,145.32 115.99,145.32 115.99,97.06 199.66,97.06 199.66,86.05 115.99,86.05 113.12,86.05 102.95,86.05 102.95,212.05 115.99,212.05" />
              <g transform="translate(-55 0)">
                <path d="M346.62,82.57c-38.79,0-70.35,29.68-70.35,66.15s31.56,66.15,70.35,66.15c38.79,0,70.35-29.68,70.35-66.15S385.41,82.57,346.62,82.57z M346.62,203.23c-32.37,0-58.7-24.45-58.7-54.51c0-30.05,26.33-54.51,58.7-54.51s58.7,24.45,58.7,54.51C405.32,178.78,378.99,203.23,346.62,203.23z" />
                <rect x="270.62" y="142.5" width="152" height="12" rx="1.5" transform="rotate(-32 346.62 148.5)" />
              </g>
            </svg>
          </div>
          <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>FormaOS</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ color: '#aeb6c2', fontSize: 14, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Compliance Operating System
          </div>
          <div style={{ color: '#ffffff', fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 860 }}>
            Turn Process Into Provable Truth
          </div>
          <div style={{ color: '#94a3b8', fontSize: 22, lineHeight: 1.5, maxWidth: 720 }}>
            Structured controls, owned actions, and immutable audit evidence for regulated industries.
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ color: '#475569', fontSize: 15 }}>formaos.com.au</div>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155' }} />
          <div style={{ color: '#475569', fontSize: 15 }}>ISO 27001 · SOC 2 · NDIS · Essential Eight</div>
        </div>

        {/* Accent gradient */}
        <div style={{
          position: 'absolute', right: 60, top: '50%',
          transform: 'translateY(-50%)',
          width: 360, height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
        }} />
      </div>
    ),
    { ...size },
  );
}
