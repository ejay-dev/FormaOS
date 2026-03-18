import { ImageResponse } from 'next/og';
import { blogPosts } from '../blogData';

export const runtime = 'edge';
export const alt = 'FormaOS Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.id === slug);
  const title = post?.title ?? 'FormaOS Blog';
  const category = post?.category ?? 'Insights';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        background:
          'linear-gradient(135deg, #0a0f1c 0%, #0d1421 50%, #0f1320 100%)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Category badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          {category}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: title.length > 60 ? '42px' : '52px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          maxWidth: '900px',
          display: 'flex',
        }}
      >
        {title}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #2dd4bf, #14b8a6, #34d399)',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
          }}
        >
          FormaOS
        </div>
        <div
          style={{
            width: '1px',
            height: '24px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: '18px',
            color: 'rgba(148, 163, 184, 1)',
            display: 'flex',
          }}
        >
          Compliance Operating System
        </div>
      </div>
    </div>,
    { ...size },
  );
}
