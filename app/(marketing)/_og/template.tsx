import { ImageResponse } from 'next/og';

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

export interface OgTemplateProps {
  eyebrow: string;
  headline: string;
  subhead?: string;
  badges?: string[];
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber';
}

const ACCENTS = {
  cyan: { fg: '#00d4fb', orb: 'rgba(0,212,251,0.12)' },
  violet: { fg: '#a78bfa', orb: 'rgba(167,139,250,0.12)' },
  emerald: { fg: '#34d399', orb: 'rgba(52,211,153,0.12)' },
  amber: { fg: '#fbbf24', orb: 'rgba(251,191,36,0.12)' },
} as const;

export function renderOg({
  eyebrow,
  headline,
  subhead,
  badges,
  accent = 'cyan',
}: OgTemplateProps) {
  const { fg, orb } = ACCENTS[accent];

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
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -60,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb} 0%, transparent 65%)`,
          }}
        />

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
              width: 44,
              height: 44,
              borderRadius: 12,
              background: fg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: '#0a0f1c', fontSize: 24, fontWeight: 900 }}>
              F
            </div>
          </div>
          <span
            style={{
              color: '#ffffff',
              fontSize: 22,
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
              color: fg,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              maxWidth: 860,
            }}
          >
            {headline}
          </div>
          {subhead ? (
            <div
              style={{
                color: '#94a3b8',
                fontSize: 22,
                lineHeight: 1.45,
                maxWidth: 760,
              }}
            >
              {subhead}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>
            www.formaos.com.au
          </div>
          {badges && badges.length > 0 ? (
            <>
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#334155',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                {badges.map((b) => (
                  <div
                    key={b}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: '#cbd5e1',
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
