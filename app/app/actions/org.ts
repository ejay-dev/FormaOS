'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/audit/legacy-log-activity';
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { getUserOrgMembership } from '@/app/app/actions/rbac';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { actionError, isNextInternalError } from '@/lib/actions/safe';

export async function updateOrganization(data: {
  name: string;
  industry?: string;
  teamSize?: string;
  domain?: string;
  registrationNumber?: string;
}) {
  try {
    const membership = await getUserOrgMembership();

    if (!['OWNER', 'COMPLIANCE_OFFICER', 'MANAGER'].includes(membership.role)) {
      throw new Error(
        'Security Violation: Only owners and admins can modify organization settings.',
      );
    }

    const admin = createSupabaseAdminClient();

    const { error } = await admin
      .from('organizations')
      .update({
        name: data.name,
        industry: data.industry,
        team_size: data.teamSize,
      })
      .eq('id', membership.orgId);

    if (error) throw error;

    await logActivity(
      membership.orgId,
      'updated_policy',
      'Admin updated organization profile settings.',
    );

    await logProductActivity(
      membership.orgId,
      membership.userId,
      'updated',
      {
        type: 'organization',
        id: membership.orgId,
        name: data.name,
        path: '/app/settings',
      },
      {
        industry: data.industry ?? null,
        teamSize: data.teamSize ?? null,
      },
    );

    await logAuditEvent({
      organizationId: membership.orgId,
      actorUserId: membership.userId,
      actorRole: membership.role,
      entityType: 'organization',
      entityId: membership.orgId,
      actionType: 'ORG_UPDATED',
      afterState: {
        name: data.name,
        industry: data.industry,
        teamSize: data.teamSize,
      },
      reason: 'org_update',
    });

    revalidatePath('/app/settings');
    revalidatePath('/app/settings/organization');
    revalidatePath('/app');
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
