import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FormaOS Pricing - Compliance infrastructure pricing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#181a1c',
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
            background: '#d4d4d8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#181a1c', fontSize: 22, fontWeight: 900 }}>
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
            color: '#a1a1aa',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: '',
          }}
        >
          Pricing
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 820,
          }}
        >
          Compliance infrastructure priced by risk and scope
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {[
            'Foundation $297/mo',
            'Growth $797/mo',
            'Scale $1,800/mo',
            'Enterprise custom',
          ].map((badge) => (
            <div
              key={badge}
              style={{
                background: 'rgba(161,161,170,0.1)',
                border: '1px solid rgba(161,161,170,0.2)',
                color: '#d4d4d8',
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {badge}
            </div>
          ))}
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
          Get your compliance plan
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 80,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(51,153,255,0.10) 0%, transparent 70%)',
        }}
      />
    </div>,
    { ...size },
  );
}
