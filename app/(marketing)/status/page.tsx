import type { Metadata } from 'next';
import { fetchPublicUptimeChecks } from '@/lib/status/public-uptime';
import StatusPageContent from './StatusPageContent';
import type { StatusRow } from './StatusPageContent';
import { siteUrl } from '@/lib/seo';

// Status page fetches live uptime data — use ISR with 60-second revalidation
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'FormaOS | Status',
  description: 'Public uptime checks and status for FormaOS.',
  alternates: { canonical: `${siteUrl}/status` },
  openGraph: {
    title: 'FormaOS | Status',
    description: 'Public uptime checks and status for FormaOS.',
    type: 'website',
    url: `${siteUrl}/status`,
    locale: 'en_AU',
    siteName: 'FormaOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Status',
    description: 'Public uptime checks and status for FormaOS.',
  },
};

function pct(ok: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((ok / total) * 10000) / 100;
}

export default async function StatusPage() {
  const now = new Date();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let rows: StatusRow[] = [];
  try {
    rows = (await fetchPublicUptimeChecks({
      sinceIso: since7d,
      limit: 4000,
    })) as StatusRow[];
  } catch {
    // Graceful degradation — render the page with empty data
  }
  const last24 = rows.filter((r) => r.checked_at >= since24h);

  const ok7 = rows.filter((r) => r.ok).length;
  const ok24 = last24.filter((r) => r.ok).length;

  const uptime7 = pct(ok7, rows.length);
  const uptime24 = pct(ok24, last24.length);

  const latest = rows[0] ?? null;

  const latencyAvgMs = (() => {
    const values = rows
      .map((r) => r.latency_ms)
      .filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  })();

  return (
    <StatusPageContent
      data={{
        rows,
        uptime7,
        uptime24,
        latencyAvgMs,
        latest,
        totalChecks7d: rows.length,
        totalChecks24h: last24.length,
        updatedAt: now.toLocaleString(),
      }}
    />
  );
}
