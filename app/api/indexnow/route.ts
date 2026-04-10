import { NextRequest, NextResponse } from 'next/server';
import { brand } from '@/config/brand';

const INDEXNOW_KEY =
  'fbceead0281aa8268b452b80e6b462dba054f412225fed18e7201eb066f0ec44';
const SITE_URL = brand.seo.siteUrl.replace(/\/$/, '');

/**
 * POST /api/indexnow — submit URLs to IndexNow (Bing, Yandex, etc.)
 *
 * Body: { urls: string[] }
 *
 * If no body is provided, submits the sitemap URL instead.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let urls: string[];

  try {
    const body = await req.json().catch(() => null);
    urls = body?.urls ?? [`${SITE_URL}/sitemap.xml`];
  } catch {
    urls = [`${SITE_URL}/sitemap.xml`];
  }

  const payload = {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.map((u) => (u.startsWith('http') ? u : `${SITE_URL}${u}`)),
  };

  const results: { engine: string; status: number }[] = [];

  for (const engine of [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ]) {
    try {
      const res = await fetch(engine, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      results.push({ engine, status: res.status });
    } catch {
      results.push({ engine, status: 0 });
    }
  }

  return NextResponse.json({ submitted: urls.length, results });
}

/**
 * GET /api/indexnow — serves the IndexNow key for verification
 */
export async function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
