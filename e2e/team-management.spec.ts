import { expect, test } from '@playwright/test';

import {
  cleanupSecondaryUsers,
  createSecondaryUser,
  ensureTeamPlanAccess,
  getMemberByUserId,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';

test.describe('Team management', () => {
  test.afterAll(async () => {
    await cleanupSecondaryUsers();
  });

  test('invite, accept, change role, verify permissions, and remove a member', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();

    await ensureTeamPlanAccess(context);

    const invitee = await createSecondaryUser(context);
    const followOnInviteEmail = `team-dummy-${Date.now()}@test.formaos.local`;
    const invitationToken = `e2e-invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const { error: inviteError } = await context.admin.from('team_invitations').insert({
      organization_id: context.orgId,
      email: invitee.email.toLowerCase(),
      role: 'member',
      token: invitationToken,
      invited_by: context.userId,
      status: 'pending',
      expires_at: new Date(Date.now() + 86400_000).toISOString(),
      created_at: now,
    });
    expect(inviteError).toBeNull();

    const { error: acceptInviteError } = await context.admin
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_by: invitee.userId,
        accepted_at: new Date().toISOString(),
      })
      .eq('organization_id', context.orgId)
      .eq('token', invitationToken);
    expect(acceptInviteError).toBeNull();

    const { error: memberInsertError } = await context.admin.from('org_members').insert({
      organization_id: context.orgId,
      user_id: invitee.userId,
      role: 'member',
    });
    expect(memberInsertError).toBeNull();

    const acceptedMember = await getMemberByUserId(context, invitee.userId);
    expect(acceptedMember.role).toBe('member');

    const { error: promoteError } = await context.admin
      .from('org_members')
      .update({ role: 'admin' })
      .eq('id', acceptedMember.id)
      .eq('organization_id', context.orgId);
    expect(promoteError).toBeNull();

    await expect
      .poll(async () => {
        const member = await getMemberByUserId(context, invitee.userId);
        return member.role;
      })
      .toBe('admin');

    const { error: followOnInviteError } = await context.admin
      .from('team_invitations')
      .insert({
        organization_id: context.orgId,
        email: followOnInviteEmail.toLowerCase(),
        role: 'viewer',
        token: `e2e-follow-on-${Date.now()}`,
        invited_by: invitee.userId,
        status: 'pending',
        expires_at: new Date(Date.now() + 86400_000).toISOString(),
      });
    expect(followOnInviteError).toBeNull();

    const { error: removeError } = await context.admin
      .from('org_members')
      .delete()
      .eq('id', acceptedMember.id)
      .eq('organization_id', context.orgId);
    expect(removeError).toBeNull();

    await expect
      .poll(async () => {
        const { data } = await context.admin
          .from('org_members')
          .select('id')
          .eq('organization_id', context.orgId)
          .eq('user_id', invitee.userId)
          .maybeSingle();
        return Boolean(data?.id);
      })
      .toBe(false);
  });
});
