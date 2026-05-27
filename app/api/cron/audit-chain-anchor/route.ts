import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  getChainTopForOrg,
  recordAnchor,
} from '@/lib/audit/external-anchor';
import { captureAuditAnchorEvent } from '@/lib/analytics/posthog-server';

const log = routeLog('/api/cron/audit-chain-anchor');

// R3/R4 follow-up (Audit 2026-05-27): periodic anchor of the audit hash
// chain to Sigstore Rekor. Feature-flagged behind AUDIT_CHAIN_ANCHOR_ENABLED
// to keep network calls off the critical path by default.
//
// Cadence: scheduled in vercel.json once-per-day. Each tick walks every
// org with chain activity since the last anchor and submits the latest
// top-entry hash to the configured external provider.
//
// Bounded: MAX_ORGS_PER_TICK prevents a single run from saturating the
// Rekor public API. Production should set this lower if signal-to-noise
// becomes a concern.
//
// Failure mode: a per-org failure is logged but does not halt the tick.
// The next run picks up where this one left off (anchored_at comparison).

const MAX_ORGS_PER_TICK = 50;
const REKOR_TIMEOUT_MS = 15_000;

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  if ((process.env.AUDIT_CHAIN_ANCHOR_ENABLED ?? '').toLowerCase() !== 'true') {
    return NextResponse.json({
      skipped: true,
      reason: 'AUDIT_CHAIN_ANCHOR_ENABLED is not true',
    });
  }

  const admin = createSupabaseAdminClient();

  // Candidate orgs: those with any audit_log row newer than the most
  // recent anchor (or no anchor at all). Pulled via two queries since
  // PostgREST joins across schemas are awkward.
  const { data: latestAnchors, error: anchorsError } = await admin
    .from('audit_chain_anchors')
    .select('org_id, anchored_at, top_sequence_number');
  if (anchorsError) {
    log.error({ err: anchorsError }, 'failed to load anchors');
    return NextResponse.json(
      { error: 'failed_to_load_anchors' },
      { status: 500 },
    );
  }

  const latestAnchorBySeqByOrg = new Map<string, number>();
  for (const row of latestAnchors ?? []) {
    const orgId = row.org_id as string | null;
    if (!orgId) continue;
    const seq = row.top_sequence_number as number;
    const prev = latestAnchorBySeqByOrg.get(orgId) ?? 0;
    if (seq > prev) latestAnchorBySeqByOrg.set(orgId, seq);
  }

  // Find orgs with at least one chained row.
  const { data: orgs, error: orgsError } = await admin
    .from('audit_log')
    .select('org_id, sequence_number')
    .not('entry_hash', 'is', null)
    .order('sequence_number', { ascending: false });
  if (orgsError) {
    log.error({ err: orgsError }, 'failed to scan audit_log');
    return NextResponse.json(
      { error: 'failed_to_scan_audit_log' },
      { status: 500 },
    );
  }

  // Reduce to the highest seq per org.
  const highestSeqByOrg = new Map<string, number>();
  for (const row of orgs ?? []) {
    const orgId = row.org_id as string | null;
    if (!orgId) continue;
    const seq = row.sequence_number as number;
    const prev = highestSeqByOrg.get(orgId) ?? 0;
    if (seq > prev) highestSeqByOrg.set(orgId, seq);
  }

  // Submit when current top seq exceeds the most recent anchored seq.
  const candidates: string[] = [];
  for (const [orgId, topSeq] of highestSeqByOrg.entries()) {
    const lastAnchored = latestAnchorBySeqByOrg.get(orgId) ?? 0;
    if (topSeq > lastAnchored) candidates.push(orgId);
    if (candidates.length >= MAX_ORGS_PER_TICK) break;
  }

  const results: Array<{
    orgId: string;
    status: 'anchored' | 'skipped' | 'failed';
    rekorUuid?: string;
    reason?: string;
  }> = [];

  for (const orgId of candidates) {
    try {
      const top = await getChainTopForOrg(orgId);
      if (!top) {
        results.push({ orgId, status: 'skipped', reason: 'no_chain_state' });
        continue;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REKOR_TIMEOUT_MS);
      let anchor;
      try {
        anchor = await recordAnchor(
          { orgId, topEntryHash: top.topEntryHash, topSequenceNumber: top.topSequenceNumber },
          { signal: controller.signal },
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!anchor) {
        results.push({ orgId, status: 'skipped', reason: 'feature_flag_off' });
      } else {
        results.push({ orgId, status: 'anchored', rekorUuid: anchor.rekorEntryUuid });
        await captureAuditAnchorEvent('audit.anchor.recorded', orgId, {
          provider: 'sigstore-rekor',
          topSequenceNumber: top.topSequenceNumber,
          rekorEntryUuid: anchor.rekorEntryUuid,
        }).catch(() => {});
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      log.warn({ err: reason, orgId }, 'anchor submission failed');
      results.push({ orgId, status: 'failed', reason });
      await captureAuditAnchorEvent('audit.anchor.failed', orgId, {
        provider: 'sigstore-rekor',
        reason,
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    candidateCount: candidates.length,
    anchored: results.filter((r) => r.status === 'anchored').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  });
}
