import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FormaOS vs Drata — Compliance Platform Comparison';
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#00d4fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#0a0f1c', fontSize: 24, fontWeight: 900 }}>F</div>
          </div>
          <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>FormaOS</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ color: '#00d4fb', fontSize: 14, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Comparison
          </div>
          <div style={{ color: '#ffffff', fontSize: 58, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 860 }}>
            FormaOS vs Drata
          </div>
          <div style={{ color: '#94a3b8', fontSize: 22, lineHeight: 1.5, maxWidth: 720 }}>
            Operational governance and defensible evidence versus checkbox automation. See which compliance platform fits regulated industries.
          </div>
        </div>

        {/* Comparison pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'rgba(0,212,251,0.12)', border: '1px solid rgba(0,212,251,0.25)', borderRadius: 8, padding: '8px 16px', color: '#00d4fb', fontSize: 14, fontWeight: 600 }}>
            FormaOS ✓
          </div>
          <div style={{ color: '#475569', fontSize: 14 }}>vs</div>
          <div style={{ background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, padding: '8px 16px', color: '#64748b', fontSize: 14, fontWeight: 600 }}>
            Drata
          </div>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155', marginLeft: 16 }} />
          <div style={{ color: '#475569', fontSize: 14 }}>formaos.com.au</div>
        </div>

        {/* Accent gradient */}
        <div style={{
          position: 'absolute', right: 60, top: '50%',
          transform: 'translateY(-50%)',
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,251,0.10) 0%, transparent 70%)',
        }} />
      </div>
    ),
    { ...size },
  );
}
