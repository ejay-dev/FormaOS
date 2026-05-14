import { blogPosts } from '@/app/(marketing)/blog/blogData';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

export async function GET() {
  const channelTitle = 'FormaOS Blog';
  const channelLink = `${siteUrl}/blog`;
  const channelDescription =
    'Expert insights on compliance management, regulatory technology, and operational excellence for regulated industries.';
  const feedSelfUrl = `${siteUrl}/blog/rss.xml`;

  const sorted = [...blogPosts].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return db - da;
  });

  const lastBuildDate = sorted[0]
    ? toRfc822(sorted[0].dateModified ?? sorted[0].date)
    : new Date().toUTCString();

  const items = sorted
    .map((post) => {
      const link = `${siteUrl}/blog/${post.id}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <dc:creator>${escapeXml(post.author)}</dc:creator>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${channelLink}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en-au</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedSelfUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
