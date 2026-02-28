import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FormaOS Security — Enterprise-grade compliance infrastructure';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#030712',
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
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#00d4fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#030712', fontSize: 22, fontWeight: 900 }}>F</div>
          </div>
          <span style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>FormaOS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ color: '#00d4fb', fontSize: 14, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Security & Compliance Infrastructure
          </div>
          <div style={{ color: '#ffffff', fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 780 }}>
            Enterprise-grade security for regulated operations
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {['Encryption at rest & transit', 'Immutable audit trails', 'SSO + MFA', 'SOC 2 aligned'].map((badge) => (
              <div key={badge} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#94a3b8',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
              }}>{badge}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ color: '#475569', fontSize: 15 }}>formaos.com.au</div>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155' }} />
          <div style={{ color: '#475569', fontSize: 15 }}>Security Review Packet available</div>
        </div>

        <div style={{
          position: 'absolute', right: 60, top: '40%',
          width: 360, height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,251,0.08) 0%, transparent 65%)',
        }} />
      </div>
    ),
    { ...size },
  );
}
