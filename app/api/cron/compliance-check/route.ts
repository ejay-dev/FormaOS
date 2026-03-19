import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { timingSafeEqual } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Scheduled compliance posture check.
 * Runs daily at 6 AM UTC via Vercel cron to:
 * 1. Detect expiring credentials (certificates, registrations)
 * 2. Flag overdue compliance tasks
 * 3. Check evidence gaps against active framework controls
 * 4. Update org compliance scores
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  const token = authHeader?.replace('Bearer ', '') ?? '';
  const tokenBuffer = Buffer.from(token, 'utf8');
  const secretBuffer = Buffer.from(cronSecret, 'utf8');
  const ok =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer);

  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const results = {
    timestamp: new Date().toISOString(),
    expiringCredentials: 0,
    overdueTasks: 0,
    evidenceGaps: 0,
    orgsChecked: 0,
  };

  try {
    // 1. Find all active organizations in batches of 100
    const BATCH_SIZE = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: orgs } = await admin
        .from('organizations')
        .select('id, name')
        .range(offset, offset + BATCH_SIZE - 1)
        .limit(BATCH_SIZE);

      if (!orgs?.length) {
        if (offset === 0) {
          return NextResponse.json({
            ...results,
            message: 'No organizations to check',
          });
        }
        break;
      }

      hasMore = orgs.length === BATCH_SIZE;
      offset += orgs.length;

    for (const org of orgs) {
      results.orgsChecked++;

      // 2. Detect expiring credentials (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringCreds, count: expiringCount } = await admin
        .from('org_credentials')
        .select('id, credential_type, holder_name, expiry_date', {
          count: 'exact',
        })
        .eq('organization_id', org.id)
        .lte('expiry_date', thirtyDaysFromNow.toISOString())
        .gte('expiry_date', new Date().toISOString())
        .eq('status', 'active');

      results.expiringCredentials += expiringCount ?? 0;

      // Create alerts for expiring credentials
      for (const cred of expiringCreds ?? []) {
        await admin.from('compliance_alerts').upsert(
          {
            organization_id: org.id,
            alert_type: 'credential_expiring',
            entity_type: 'credential',
            entity_id: cred.id,
            severity: 'warning',
            title: `${cred.credential_type} expiring for ${cred.holder_name}`,
            detail: `Expires on ${cred.expiry_date}. Renewal required to maintain compliance.`,
            resolved: false,
          },
          { onConflict: 'organization_id,entity_type,entity_id,alert_type' },
        );
      }

      // 3. Flag overdue tasks
      const { count: overdueCount } = await admin
        .from('org_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .in('status', ['pending', 'in_progress'])
        .lt('due_date', new Date().toISOString());

      results.overdueTasks += overdueCount ?? 0;

      // 4. Check evidence gaps: controls without linked evidence
      const { count: gapCount } = await admin
        .from('org_controls')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'active')
        .is('latest_evidence_id', null);

      results.evidenceGaps += gapCount ?? 0;

      // 5. Update org compliance score
      const { count: totalControls } = await admin
        .from('org_controls')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'active');

      const { count: coveredControls } = await admin
        .from('org_controls')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'active')
        .not('latest_evidence_id', 'is', null);

      const score = totalControls
        ? Math.round(((coveredControls ?? 0) / totalControls) * 100)
        : 0;

      await admin.from('org_compliance_scores').upsert(
        {
          organization_id: org.id,
          score,
          total_controls: totalControls ?? 0,
          covered_controls: coveredControls ?? 0,
          evidence_gaps: gapCount ?? 0,
          overdue_tasks: overdueCount ?? 0,
          expiring_credentials: expiringCount ?? 0,
          checked_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' },
      );
    }
    } // end while (hasMore)

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        ...results,
      },
      { status: 500 },
    );
  }
}
