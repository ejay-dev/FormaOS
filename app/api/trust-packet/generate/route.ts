import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

/**
 * POST /api/trust-packet/generate
 *
 * Generates a Trust Packet — a secure, time-limited link that bundles:
 * - Security overview
 * - Compliance framework mappings
 * - Active policies
 * - Risk posture summary
 * - Framework coverage stats
 *
 * The link expires after configurable duration (default 7 days).
 * Reduces enterprise sales friction by enabling self-service due diligence.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 },
      );
    }

    // Only owners and admins can generate trust packets
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const expiresInDays = body.expiresInDays ?? 7;
    const recipientEmail = body.recipientEmail ?? null;
    const note = body.note ?? null;

    // Generate a secure, unique token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Collect trust packet data
    const [frameworksResult, policiesResult, controlsResult] =
      await Promise.all([
        supabase
          .from('org_frameworks')
          .select('framework_key, status, created_at')
          .eq('org_id', membership.org_id),
        supabase
          .from('policies')
          .select('id, title, status, last_reviewed_at')
          .eq('org_id', membership.org_id)
          .eq('status', 'active'),
        supabase
          .from('controls')
          .select('id, status, framework_key')
          .eq('org_id', membership.org_id),
      ]);

    const frameworks = frameworksResult.data ?? [];
    const policies = policiesResult.data ?? [];
    const controls = controlsResult.data ?? [];

    // Calculate coverage stats
    const totalControls = controls.length;
    const implementedControls = controls.filter(
      (c: { id: string; status: string; framework_key: string }) =>
        c.status === 'implemented' || c.status === 'verified',
    ).length;
    const coveragePercent =
      totalControls > 0
        ? Math.round((implementedControls / totalControls) * 100)
        : 0;

    const { data: subscriptionRow } = await supabase
      .from('org_subscriptions')
      .select('plan_key, status')
      .eq('organization_id', membership.org_id)
      .maybeSingle();
    const isEnterprisePlan = (subscriptionRow as any)?.plan_key === 'enterprise';

    const packetData = {
      generated_at: new Date().toISOString(),
      org_id: membership.org_id,
      generated_by: user.id,
      recipient_email: recipientEmail,
      note,
      security_overview: {
        role_based_access: true,
        audit_logging: true,
        encryption_at_rest: true,
        encryption_in_transit: true,
        sso_available: Boolean(isEnterprisePlan),
        mfa_available: true,
      },
      compliance_summary: {
        frameworks_enabled: frameworks.length,
        active_policies: policies.length,
        total_controls: totalControls,
        implemented_controls: implementedControls,
        coverage_percent: coveragePercent,
      },
      frameworks: frameworks.map(
        (f: { framework_key: string; status: string; created_at: string }) => ({
          key: f.framework_key,
          status: f.status,
          enabled_at: f.created_at,
        }),
      ),
      policies_summary: {
        total: policies.length,
        recently_reviewed: policies.filter(
          (p: {
            id: string;
            title: string;
            status: string;
            last_reviewed_at: string | null;
          }) => {
            if (!p.last_reviewed_at) return false;
            const reviewed = new Date(p.last_reviewed_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return reviewed > thirtyDaysAgo;
          },
        ).length,
      },
    };

    // Store the trust packet
    const { error: insertError } = await supabase.from('trust_packets').insert({
      token,
      org_id: membership.org_id,
      generated_by: user.id,
      recipient_email: recipientEmail,
      note,
      packet_data: packetData,
      expires_at: expiresAt.toISOString(),
    });

    // If table doesn't exist yet, return the packet data directly
    if (insertError) {
      console.warn(
        'Trust packets table may not exist yet:',
        insertError.message,
      );
      // Still return the packet data — just without persistence
      return NextResponse.json({
        success: true,
        packet: packetData,
        shareUrl: null,
        expiresAt: expiresAt.toISOString(),
        warning:
          'Trust packet generated but not persisted. Run the trust_packets migration to enable sharing links.',
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const shareUrl = `${appUrl}/trust-packet/${token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
      packet: packetData,
    });
  } catch (error) {
    console.error('Trust packet generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate trust packet' },
      { status: 500 },
    );
  }
}
