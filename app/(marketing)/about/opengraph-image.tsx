import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'About FormaOS — Built for Teams Accountable to Regulators';
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#0a0f1c', fontSize: 24, fontWeight: 900 }}>F</div>
          </div>
          <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>FormaOS</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ color: '#a78bfa', fontSize: 14, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            About
          </div>
          <div style={{ color: '#ffffff', fontSize: 58, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 840 }}>
            Built for Teams Accountable to Regulators
          </div>
          <div style={{ color: '#94a3b8', fontSize: 22, lineHeight: 1.5, maxWidth: 720 }}>
            Delivering operational clarity for regulated industries through structured controls, owned evidence, and defensible audit trails.
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ color: '#475569', fontSize: 15 }}>formaos.com.au</div>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155' }} />
          <div style={{ color: '#475569', fontSize: 15 }}>Our Mission</div>
        </div>

        {/* Violet accent gradient */}
        <div style={{
          position: 'absolute', right: 60, top: '50%',
          transform: 'translateY(-50%)',
          width: 340, height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
        }} />
      </div>
    ),
    { ...size },
  );
}
