import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createInvitation } from '@/lib/invitations/create-invitation';
import { sendEmail } from '@/lib/email/send-email';
import { hasPermission, normalizeRole } from '@/app/app/actions/rbac';
import { getEntitlementLimit } from '@/lib/billing/entitlements';
import {
  rateLimitApi,
} from '@/lib/security/rate-limiter';
import {
  emailSchema,
  uuidSchema,
  validateBody,
  formatZodError,
} from '@/lib/security/api-validation';
import { z } from 'zod';

const inviteSchema = z.object({
  organizationId: uuidSchema,
  email: emailSchema,
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify user is authenticated
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await rateLimitApi(request, data.user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.resetAt },
        { status: 429 },
      );
    }

    const parsed = await validateBody(request, inviteSchema);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const { organizationId, email, role } = parsed.data;

    // Check if user is admin/owner of the organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', data.user.id)
      .single();

    const roleKey = normalizeRole(membership?.role ?? null);
    if (!membership || !hasPermission(roleKey, 'MANAGE_USERS')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
    }

    try {
      const limit = await getEntitlementLimit(organizationId, 'team_limit');
      if (limit) {
        const [{ count: memberCount }, { count: inviteCount }] =
          await Promise.all([
            supabase
              .from('org_members')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', organizationId),
            supabase
              .from('team_invitations')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', organizationId)
              .eq('status', 'pending'),
          ]);

        if ((memberCount ?? 0) + (inviteCount ?? 0) >= limit) {
          return NextResponse.json(
            { error: 'Team limit reached for current plan' },
            { status: 403 },
          );
        }
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || 'Subscription required' },
        { status: 403 },
      );
    }

    if (data.user.email && data.user.email.toLowerCase() === email) {
      return NextResponse.json(
        { error: 'You are already a member of this organization' },
        { status: 400 },
      );
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 },
      );
    }

    // Create invitation
    const result = await createInvitation({
      organizationId,
      email,
      role,
      invitedBy: data.user.id,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 },
      );
    }

    // Get organization and inviter details
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    const inviterName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split('@')[0] ||
      'A team member';

    // Send invitation email
    const inviteBase =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'https://app.formaos.com.au';
    const inviteUrl = `${inviteBase.replace(/\/$/, '')}/accept-invite/${result.data.token}`;

    await sendEmail({
      type: 'invite',
      to: email,
      inviterName,
      inviterEmail: data.user.email!,
      organizationName: org?.name || 'Organization',
      inviteUrl,
      role,
      organizationId,
      userId: data.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.data.id,
        email: result.data.email,
        role: result.data.role,
        expiresAt: result.data.expires_at,
      },
    });
  } catch (error) {
    console.error('[API /invitations/create] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
