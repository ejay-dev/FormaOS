import { expect, test, type Page } from '@playwright/test';

import {
  createMagicLinkSession,
  setPlaywrightSession,
} from './helpers/test-auth';
import {
  authenticateWorkspacePage,
  cleanupSecondaryUsers,
  configureWorkspaceState,
  createSecondaryUser,
  ensureTeamPlanAccess,
  getInvitationByEmail,
  getMemberByUserId,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';

const APP_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function selectActiveOrganization(
  page: Page,
  organizationId: string,
): Promise<void> {
  const response = await page.request.post(
    `${APP_BASE}/api/v1/account/active-organization`,
    {
      headers: { Origin: APP_BASE },
      data: { organizationId },
    },
  );
  expect(response.status()).toBe(200);
}

test.describe('Team management', () => {
  test.afterAll(async () => {
    await cleanupSecondaryUsers();
  });

  test('invite, accept, change role, verify permissions, and remove a member', async ({
    page,
    browser,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    test.setTimeout(180_000);

    const context = await getWorkspaceSeedContext();

    await ensureTeamPlanAccess(context);
    // The invite route only admits owners and admins; pin the seed user's
    // role so the 403 assertions below are about the invitee, not the host.
    await configureWorkspaceState(context, { role: 'owner' });

    const invitee = await createSecondaryUser(context);
    const followOnInviteEmail = `team-dummy-${Date.now()}@test.formaos.local`;

    await authenticateWorkspacePage(page, context.email);
    await selectActiveOrganization(page, context.orgId);

    const inviteeBrowserContext = await browser.newContext();

    try {
      // ---------------------------------------------------------------
      // 1. Invite — through POST /api/v1/members/invite, not a raw insert.
      // ---------------------------------------------------------------
      const inviteResponse = await page.request.post(
        `${APP_BASE}/api/v1/members/invite`,
        {
          headers: { Origin: APP_BASE },
          data: { invites: [{ email: invitee.email, role: 'member' }] },
        },
      );
      expect(inviteResponse.status()).toBe(200);
      expect(await inviteResponse.json()).toEqual({
        results: [{ email: invitee.email.toLowerCase(), ok: true }],
      });

      const invitation = await getInvitationByEmail(context, invitee.email);
      expect(invitation.status).toBe('pending');
      expect(invitation.role).toBe('member');
      expect(invitation.organization_id).toBe(context.orgId);
      expect(invitation.invited_by).toBe(context.userId);
      // createInvitation mints a 32-byte hex token; a short or reused token
      // would be a guessable invite link.
      expect(String(invitation.token)).toMatch(/^[0-9a-f]{64}$/);

      // An invitation on its own must NOT confer membership.
      const { data: preAcceptMembership } = await context.admin
        .from('org_members')
        .select('id')
        .eq('organization_id', context.orgId)
        .eq('user_id', invitee.userId)
        .maybeSingle();
      expect(preAcceptMembership).toBeNull();

      // ---------------------------------------------------------------
      // 2. Accept — through the real /accept-invite/[token] server action.
      // ---------------------------------------------------------------
      const inviteePage = await inviteeBrowserContext.newPage();
      // NOTE: createPasswordSession() short-circuits to the cached primary
      // test-user session regardless of the email argument, which would run
      // this half of the flow as the inviter. Magic link is per-email.
      const inviteeSession = await createMagicLinkSession(invitee.email);
      await setPlaywrightSession(inviteeBrowserContext, inviteeSession, APP_BASE);

      await inviteePage.goto(`${APP_BASE}/accept-invite/${invitation.token}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(
        inviteePage.getByRole('heading', { level: 1 }),
      ).toContainText('Join');
      await expect(
        inviteePage.getByText(invitee.email.toLowerCase()).first(),
      ).toBeVisible();

      await inviteePage
        .getByRole('button', { name: /Accept Invitation/i })
        .click();
      // `member` and `viewer` invitees are routed to the employee wizard;
      // landing anywhere else means the role-based redirect regressed.
      await inviteePage.waitForURL(/\/onboarding\/employee/, {
        timeout: 60_000,
      });

      const acceptedInvitation = await getInvitationByEmail(
        context,
        invitee.email,
      );
      expect(acceptedInvitation.status).toBe('accepted');
      expect(acceptedInvitation.accepted_by).toBe(invitee.userId);
      expect(acceptedInvitation.accepted_at).not.toBeNull();

      const acceptedMember = await getMemberByUserId(context, invitee.userId);
      expect(acceptedMember.role).toBe('member');
      expect(acceptedMember.organization_id).toBe(context.orgId);

      // ---------------------------------------------------------------
      // 3. Verify permissions — a plain member cannot invite.
      // ---------------------------------------------------------------
      const memberInviteAttempt = await inviteePage.request.post(
        `${APP_BASE}/api/v1/members/invite`,
        {
          headers: { Origin: APP_BASE },
          data: { invites: [{ email: followOnInviteEmail, role: 'viewer' }] },
        },
      );
      expect(memberInviteAttempt.status()).toBe(403);

      // A member also cannot mutate other members.
      const memberRoleChangeAttempt = await inviteePage.request.patch(
        `${APP_BASE}/api/v1/members/${acceptedMember.id}`,
        {
          headers: { Origin: APP_BASE },
          data: { role: 'owner' },
        },
      );
      expect(memberRoleChangeAttempt.status()).toBe(403);
      expect((await getMemberByUserId(context, invitee.userId)).role).toBe(
        'member',
      );

      // ---------------------------------------------------------------
      // 4. Change role — through PATCH /api/v1/members/[memberId].
      // ---------------------------------------------------------------
      const promoteResponse = await page.request.patch(
        `${APP_BASE}/api/v1/members/${acceptedMember.id}`,
        {
          headers: { Origin: APP_BASE },
          data: { role: 'admin' },
        },
      );
      expect(promoteResponse.status()).toBe(200);

      await expect
        .poll(async () => {
          const member = await getMemberByUserId(context, invitee.userId);
          return member.role;
        })
        .toBe('admin');

      // The promotion must actually widen what the invitee can do.
      const adminInviteAttempt = await inviteePage.request.post(
        `${APP_BASE}/api/v1/members/invite`,
        {
          headers: { Origin: APP_BASE },
          data: { invites: [{ email: followOnInviteEmail, role: 'viewer' }] },
        },
      );
      expect(adminInviteAttempt.status()).toBe(200);
      const adminInviteBody = (await adminInviteAttempt.json()) as {
        results: Array<{ email: string; ok: boolean; error?: string }>;
      };
      expect(adminInviteBody.results[0]).toEqual({
        email: followOnInviteEmail.toLowerCase(),
        ok: true,
      });

      // …but an admin still cannot grant the owner role.
      const adminOwnerGrantAttempt = await inviteePage.request.patch(
        `${APP_BASE}/api/v1/members/${acceptedMember.id}`,
        {
          headers: { Origin: APP_BASE },
          data: { role: 'owner' },
        },
      );
      expect(adminOwnerGrantAttempt.status()).toBe(403);
      expect((await getMemberByUserId(context, invitee.userId)).role).toBe(
        'admin',
      );

      // ---------------------------------------------------------------
      // 5. Remove — through DELETE /api/v1/members/[memberId].
      // ---------------------------------------------------------------
      const removeResponse = await page.request.delete(
        `${APP_BASE}/api/v1/members/${acceptedMember.id}`,
        { headers: { Origin: APP_BASE } },
      );
      expect(removeResponse.status()).toBe(200);

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

      // Removal must revoke org access, not just hide the row: the invite
      // the ex-admin could make one step ago now fails org resolution.
      await expect
        .poll(
          async () => {
            const response = await inviteePage.request.post(
              `${APP_BASE}/api/v1/members/invite`,
              {
                headers: { Origin: APP_BASE },
                data: {
                  invites: [{ email: followOnInviteEmail, role: 'viewer' }],
                },
              },
            );
            return response.status();
          },
          { timeout: 20_000 },
        )
        .toBe(400);
    } finally {
      await inviteeBrowserContext.close();
      await context.admin
        .from('team_invitations')
        .delete()
        .eq('organization_id', context.orgId)
        .in('email', [
          invitee.email.toLowerCase(),
          followOnInviteEmail.toLowerCase(),
        ]);
    }
  });
});
