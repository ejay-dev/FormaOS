import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FormaOS — The Compliance Operating System for Australian Regulated Industries';
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
          overflow: 'hidden',
        }}
      >
        {/* Background accent orbs */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -60,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0,212,251,0.12) 0%, transparent 65%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 100,
            bottom: -120,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)',
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#00d4fb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{ color: '#0a0f1c', fontSize: 28, fontWeight: 900 }}
            >
              F
            </div>
          </div>
          <span
            style={{
              color: '#ffffff',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            FormaOS
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              color: '#00d4fb',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
            }}
          >
            Compliance Operating System
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              maxWidth: 900,
            }}
          >
            Governance, Evidence & Audits — One Platform
          </div>
          <div
            style={{
              color: '#94a3b8',
              fontSize: 24,
              lineHeight: 1.5,
              maxWidth: 740,
            }}
          >
            Purpose-built for Australian regulated industries. NDIS, healthcare, financial services, childcare & construction.
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>
            www.formaos.com.au
          </div>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#334155',
            }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            {['ISO 27001', 'SOC 2', 'NDIS', 'HIPAA', 'GDPR'].map(
              (fw) => (
                <div
                  key={fw}
                  style={{
                    background: 'rgba(0,212,251,0.08)',
                    border: '1px solid rgba(0,212,251,0.15)',
                    color: '#00d4fb',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {fw}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
