import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt =
  'Construction WHS Compliance Software — SafeWork & Site Safety | FormaOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
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
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#f97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#0a0f1c', fontSize: 22, fontWeight: 900 }}>
            F
          </div>
        </div>
        <span
          style={{
            color: '#ffffff',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          FormaOS
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            color: '#f97316',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Construction WHS Compliance
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 820,
          }}
        >
          WHS Compliance for Construction & High-Risk Work
        </div>
        <div
          style={{
            color: '#94a3b8',
            fontSize: 22,
            lineHeight: 1.5,
            maxWidth: 700,
          }}
        >
          SafeWork compliance, SWMS management, site safety audits, and incident
          reporting.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ color: '#475569', fontSize: 15 }}>formaos.com.au</div>
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#334155',
          }}
        />
        <div style={{ color: '#475569', fontSize: 15 }}>
          WHS · SafeWork · SWMS · ISO 45001
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 60,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
        }}
      />
    </div>,
    { ...size },
  );
}
