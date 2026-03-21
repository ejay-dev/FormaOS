import { expect, test, type Page } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

import {
  authenticateWorkspacePage,
  cleanupSecondaryUsers,
  configureWorkspaceState,
  createSecondaryUser,
  ensureFrameworkScore,
  ensureTeamPlanAccess,
  getWorkspaceSeedContext,
  seedEvidence,
  seedIncident,
  seedParticipant,
  seedPendingInvitation,
  seedPolicy,
  seedStaffCredential,
  seedTask,
  seedVisit,
  type WorkspaceSeedContext,
} from './helpers/workspace-seed';
import { INDUSTRY_OPTIONS } from '../lib/validators/organization';

loadEnv({ path: '.env.local' });

type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

type SecondaryAccount = {
  email: string;
  password: string;
  userId: string;
};

const ALL_INDUSTRIES = INDUSTRY_OPTIONS.map((option) => option.id);
const CARE_INDUSTRIES = [
  'ndis',
  'healthcare',
  'aged_care',
  'childcare',
  'community_services',
] as const;
const GOVERNANCE_INDUSTRIES = [
  'financial_services',
  'saas_technology',
  'enterprise',
  'other',
] as const;

const PARTICIPANT_LABELS: Record<string, string> = {
  ndis: 'Participants',
  healthcare: 'Patients',
  aged_care: 'Residents',
  childcare: 'Clients',
  community_services: 'Clients',
};

const VISIT_LABELS: Record<string, string> = {
  ndis: 'Service Delivery',
  healthcare: 'Appointments',
  aged_care: 'Service Logs',
  childcare: 'Visits',
  community_services: 'Visits',
};

const DASHBOARD_EXPECTATIONS: Record<
  string,
  Array<{ label: string; href: string }>
> = {
  ndis: [
    { label: 'Participants', href: '/app/participants' },
    { label: 'Service Delivery', href: '/app/visits' },
  ],
  healthcare: [
    { label: 'Patients', href: '/app/participants' },
    { label: 'Appointments', href: '/app/visits' },
  ],
  aged_care: [
    { label: 'Residents', href: '/app/participants' },
    { label: 'Care Plans', href: '/app/care-plans' },
  ],
  childcare: [
    { label: 'Children', href: '/app/participants' },
    { label: 'Safety Checks', href: '/app/registers' },
  ],
  community_services: [
    { label: 'Clients', href: '/app/participants' },
    { label: 'Service Delivery', href: '/app/visits' },
  ],
  financial_services: [
    { label: 'Policies', href: '/app/policies' },
    { label: 'Risk Registers', href: '/app/registers' },
  ],
  saas_technology: [
    { label: 'Policies', href: '/app/policies' },
    { label: 'Asset Inventory', href: '/app/registers' },
  ],
  enterprise: [
    { label: 'Policies', href: '/app/policies' },
    { label: 'Registers', href: '/app/registers' },
  ],
  other: [
    { label: 'Organization', href: '/app/executive' },
    { label: 'Certificates', href: '/app/certificates' },
  ],
};

let workspace: WorkspaceSeedContext | null = null;
let memberUser: SecondaryAccount | null = null;
let viewerUser: SecondaryAccount | null = null;

function requireWorkspace() {
  if (!workspace) {
    throw new Error('Workspace not initialized');
  }
  return workspace;
}

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function plusAlias(label: string) {
  return `ejazhussaini313+${label.replace(/[^a-z0-9]+/gi, '').toLowerCase()}@gmail.com`;
}

async function authenticate(page: Page, email?: string) {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_test_mode', 'true');
  });
  await authenticateWorkspacePage(page, email);
}

async function gotoHealthy(page: Page, href: string) {
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

  const body = (await page.locator('body').textContent()) ?? '';
  expect(body).not.toContain('This page could not be found');
  expect(body).not.toContain("FormaOS couldn't load");
  expect(body).not.toContain('Minified React error');
}

async function setMembershipRole(userId: string, role: UserRole) {
  const ctx = requireWorkspace();
  const { error } = await ctx.admin
    .from('org_members')
    .update({ role })
    .eq('organization_id', ctx.orgId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to set role ${role} for ${userId}: ${error.message}`);
  }
}

async function setEntitlement(
  featureKey: string,
  enabled: boolean,
  limitValue: number | null = null,
) {
  const ctx = requireWorkspace();
  const now = new Date().toISOString();
  const { data: existing, error } = await ctx.admin
    .from('org_entitlements')
    .select('id')
    .eq('organization_id', ctx.orgId)
    .eq('feature_key', featureKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read entitlement ${featureKey}: ${error.message}`);
  }

  if (existing?.id) {
    const { error: updateError } = await ctx.admin
      .from('org_entitlements')
      .update({
        enabled,
        limit_value: limitValue,
        updated_at: now,
      })
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(
        `Failed to update entitlement ${featureKey}: ${updateError.message}`,
      );
    }
    return;
  }

  const { error: insertError } = await ctx.admin.from('org_entitlements').insert({
    organization_id: ctx.orgId,
    feature_key: featureKey,
    enabled,
    limit_value: limitValue,
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    throw new Error(
      `Failed to create entitlement ${featureKey}: ${insertError.message}`,
    );
  }
}

async function syncPlan(planKey: 'starter' | 'pro' | 'enterprise') {
  const ctx = requireWorkspace();
  const now = new Date().toISOString();
  const trialExpiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await ctx.admin
    .from('organizations')
    .update({ plan_key: planKey, updated_at: now })
    .eq('id', ctx.orgId);

  const { data: subscription } = await ctx.admin
    .from('org_subscriptions')
    .select('id')
    .eq('organization_id', ctx.orgId)
    .maybeSingle();

  if (subscription?.id) {
    await ctx.admin
      .from('org_subscriptions')
      .update({
        plan_key: planKey,
        status: 'trialing',
        trial_started_at: now,
        trial_expires_at: trialExpiresAt,
        updated_at: now,
      })
      .eq('id', subscription.id);
  } else {
    await ctx.admin.from('org_subscriptions').insert({
      organization_id: ctx.orgId,
      plan_key: planKey,
      status: 'trialing',
      trial_started_at: now,
      trial_expires_at: trialExpiresAt,
      created_at: now,
      updated_at: now,
    });
  }
}

async function prepareOwnerIndustry(industry: string) {
  const ctx = requireWorkspace();
  await setMembershipRole(ctx.userId, 'owner');
  await configureWorkspaceState(ctx, {
    role: 'owner',
    industry,
    frameworks: ['soc2', 'hipaa'],
    onboardingCompleted: true,
    currentStep: 7,
    completedSteps: [1, 2, 3, 4, 5, 6, 7],
    organizationName: `Deep ${industry} Workspace`,
    planKey: 'enterprise',
    teamSize: '11-50',
    firstAction: 'review_dashboard',
  });
  await syncPlan('enterprise');
  await ensureTeamPlanAccess(ctx);
  await setEntitlement('audit_export', true);
  await setEntitlement('framework_evaluations', true);
  await setEntitlement('team', true);
  await setEntitlement('team_limit', true, 75);
  await ensureFrameworkScore(ctx, 'soc2', 91);
  await ensureFrameworkScore(ctx, 'hipaa', 87);
}

test.describe.serial('Deep dashboard workflows', () => {
  test.beforeAll(async () => {
    workspace = await getWorkspaceSeedContext();
    await createSecondaryUser(requireWorkspace(), {
      addMembership: true,
      role: 'admin',
    });
    memberUser = await createSecondaryUser(requireWorkspace(), {
      addMembership: true,
      role: 'member',
    });
    viewerUser = await createSecondaryUser(requireWorkspace(), {
      addMembership: true,
      role: 'viewer',
    });
  });

  test.afterAll(async () => {
    await cleanupSecondaryUsers();
  });

  for (const industry of ALL_INDUSTRIES) {
    test(`owner dashboard shows industry actions for ${industry}`, async ({
      page,
    }) => {
      await prepareOwnerIndustry(industry);
      await authenticate(page);
      await gotoHealthy(page, '/app');

      await expect(page.getByTestId('quick-actions')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /dashboard|command center|compliance/i }).first(),
      ).toBeVisible();

      for (const action of DASHBOARD_EXPECTATIONS[industry]) {
        await expect(
          page.getByTestId('quick-actions').locator(`a[href="${action.href}"]`),
        ).toContainText(action.label);
      }
    });
  }

  for (const industry of CARE_INDUSTRIES) {
    test(`care operations render seeded data for ${industry}`, async ({
      page,
    }) => {
      const ctx = requireWorkspace();
      const label = uniqueId(industry);

      await prepareOwnerIndustry(industry);
      const participant = await seedParticipant(ctx, {
        fullName: `${label} Care Client`,
        fundingType: industry === 'ndis' ? 'ndis' : 'private',
        ndisNumber: industry === 'ndis' ? `${Date.now()}` : null,
        primaryDiagnosis: 'E2E seeded diagnosis',
      });
      await seedVisit(ctx, {
        clientId: String(participant.id),
        visitType: 'service',
        serviceCategory: 'community_access',
        notes: `${label} scheduled visit`,
      });
      await seedIncident(ctx, {
        patientId: String(participant.id),
        severity: 'high',
        description: `${label} incident for seeded workflow coverage`,
        followUpRequired: true,
        followUpDueDate: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
      await seedStaffCredential(ctx, {
        credentialName: `${label} Credential`,
        credentialType: 'e2e_custom',
        issuingAuthority: 'FormaOS Test Authority',
      });

      await authenticate(page);

      await gotoHealthy(page, `/app/participants?q=${encodeURIComponent(label)}`);
      await expect(page.getByTestId('participants-title')).toContainText(
        PARTICIPANT_LABELS[industry],
      );
      await expect(page.getByTestId('participants-table')).toContainText(label);
      await page.getByTestId('add-participant-btn').click();
      await expect(page.getByRole('heading', { name: /Add New/i })).toBeVisible();
      await expect(page.locator('input[name="full_name"]')).toBeVisible();

      await gotoHealthy(page, `/app/visits?q=${encodeURIComponent(label)}`);
      await expect(page.getByTestId('visits-title')).toContainText(
        VISIT_LABELS[industry],
      );
      await expect(page.getByTestId('visits-table')).toContainText(label);
      await page.getByTestId('add-visit-btn').click();
      await expect(
        page.getByRole('heading', { name: /Schedule Visit/i }),
      ).toBeVisible();
      await expect(page.locator('select[name="client_id"]')).toContainText(label);

      await gotoHealthy(page, `/app/incidents?q=${encodeURIComponent(label)}`);
      await expect(page.getByTestId('incidents-title')).toBeVisible();
      await expect(page.getByTestId('incidents-table')).toContainText(label);
      await page.getByTestId('report-incident-btn').click();
      await expect(
        page.getByRole('heading', { name: /Report Incident/i }),
      ).toBeVisible();
      await expect(page.locator('select[name="patient_id"]')).toContainText(label);

      await gotoHealthy(page, '/app/staff-compliance');
      await expect(page.getByTestId('staff-compliance-title')).toBeVisible();
      await expect(page.getByTestId('staff-credentials-table')).toContainText(label);
      await page.getByTestId('add-credential-btn').click();
      await expect(
        page.getByRole('heading', { name: /Add Credential/i }),
      ).toBeVisible();
      await expect(page.locator('select[name="user_id"]')).toBeVisible();
    });
  }

  for (const industry of GOVERNANCE_INDUSTRIES) {
    test(`governance modules render seeded data for ${industry}`, async ({
      page,
    }) => {
      test.setTimeout(300_000);

      const ctx = requireWorkspace();
      const label = uniqueId(industry);
      const inviteEmail = plusAlias(label);

      await prepareOwnerIndustry(industry);
      const task = await seedTask(ctx, {
        title: `${label} Governance Task`,
        priority: 'high',
      });
      await seedEvidence(ctx, {
        fileName: `${label}-artifact.txt`,
        title: `${label} Artifact`,
        taskId: String(task.id),
        uploadedBy: ctx.userId,
        verificationStatus: 'pending',
      });
      await seedPolicy(ctx, {
        title: `${label} Policy`,
        frameworkTag: 'SOC 2',
        content: `Policy content for ${label}`,
      });
      await seedPendingInvitation(ctx, `${label}@example.com`, 'viewer');

      await authenticate(page);

      await gotoHealthy(page, `/app/tasks?q=${encodeURIComponent(label)}`);
      await expect(page.getByRole('heading', { name: 'Compliance Roadmap' })).toBeVisible();
      await expect(page.locator('table')).toContainText(label);
      await page
        .locator('summary')
        .filter({ hasText: 'Add Requirement' })
        .evaluate((element) => {
          const parent = element.parentElement;
          if (parent instanceof HTMLDetailsElement) {
            parent.open = true;
          } else {
            element.click();
          }
        });
      await expect(page.locator('input[name="title"]')).toBeVisible();
      await page.locator('input[name="title"]').fill(`${label} UI Task`);
      await page
        .locator('form')
        .filter({ has: page.locator('input[name="title"]') })
        .evaluate((form) => {
          if (form instanceof HTMLFormElement) {
            form.requestSubmit();
          }
        });
      await page.waitForTimeout(3_000);
      await gotoHealthy(page, `/app/tasks?q=${encodeURIComponent(label)}`);
      await expect(page.locator('body')).toContainText(`${label} UI Task`);

      await gotoHealthy(page, `/app/policies`);
      await expect(page.getByRole('heading', { name: 'Policy Library' })).toBeVisible();
      await expect(page.locator('body')).toContainText(`${label} Policy`);
      await gotoHealthy(page, '/app/policies/new');
      await expect(page.getByRole('heading', { name: 'Create Policy' })).toBeVisible();
      await expect(page.locator('input[name="title"]')).toBeVisible();

      await gotoHealthy(page, `/app/vault?q=${encodeURIComponent(label)}`);
      await expect(page.getByRole('heading', { name: 'Evidence Vault' })).toBeVisible();
      await expect(page.locator('body')).toContainText(`${label}-artifact.txt`);
      await expect(page.getByRole('button', { name: /Upload/i })).toHaveCount(1);

      await gotoHealthy(page, '/app/team');
      await expect(page.getByRole('heading', { name: 'Team Management' })).toBeVisible();
      await expect(page.locator('body')).toContainText(`${label}@example.com`);
      await page
        .getByRole('button', { name: 'Invite Member' })
        .evaluate((button) => {
          if (button instanceof HTMLButtonElement) {
            button.click();
          }
        });
      await page.locator('input[type="email"]').fill(inviteEmail);
      await page
        .getByRole('button', { name: 'Send Invite' })
        .click({ timeout: 3_000 })
        .catch(async () => {
          await page
            .locator('form')
            .filter({ has: page.locator('input[type="email"]') })
            .evaluate((form) => {
              if (form instanceof HTMLFormElement) {
                form.requestSubmit();
              }
            });
        });
      let inviteSuccessVisible = true;
      try {
        await expect(
          page.getByText(/Invitation Sent|Invitation Created/),
        ).toBeVisible({ timeout: 20_000 });
      } catch {
        inviteSuccessVisible = false;
      }

      await expect
        .poll(
          async () => {
            const { count, error } = await ctx.admin
              .from('team_invitations')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', ctx.orgId)
              .eq('email', inviteEmail.toLowerCase())
              .eq('status', 'pending');

            if (error) {
              throw new Error(error.message);
            }

            return count ?? 0;
          },
          {
            message: `Expected pending invitation for ${inviteEmail}`,
            timeout: 30_000,
          },
        )
        .toBeGreaterThan(0);

      if (!inviteSuccessVisible) {
        await gotoHealthy(page, '/app/team');
      }

      await gotoHealthy(page, '/app/reports');
      await expect(page.getByRole('heading', { name: 'Reports Center' })).toBeVisible();
      await expect(page.locator('body')).toContainText('Trust packet');
      await expect(page.locator('body')).toContainText('Exports enabled');

      await gotoHealthy(page, '/app/billing');
      await expect(page.getByRole('heading', { name: 'Billing & Plan' })).toBeVisible();
      await expect(page.locator('body')).toContainText('Current plan');
      await expect(page.locator('body')).toContainText('Enterprise');

      await gotoHealthy(page, '/app/executive');
      await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
      await expect(page.locator('body')).toContainText('Critical Control Gaps');
    });
  }

  test('member and viewer personas stay read-only across dashboard and reports', async ({
    browser,
  }) => {
    if (!memberUser || !viewerUser) {
      throw new Error('Secondary users not initialized');
    }

    await prepareOwnerIndustry('enterprise');
    await setMembershipRole(memberUser.userId, 'member');
    await setMembershipRole(viewerUser.userId, 'viewer');

    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await authenticate(memberPage, memberUser.email);
    await gotoHealthy(memberPage, '/app');
    await expect(memberPage.getByText('My Compliance Status')).toBeVisible();
    await expect(memberPage.getByTestId('quick-actions')).toHaveCount(0);
    await gotoHealthy(memberPage, '/app/reports');
    await expect(memberPage.locator('body')).toContainText('Admin access required');
    await memberContext.close();

    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    await authenticate(viewerPage, viewerUser.email);
    await gotoHealthy(viewerPage, '/app');
    await expect(viewerPage.getByText('My Compliance Status')).toBeVisible();
    await expect(viewerPage.getByTestId('quick-actions')).toHaveCount(0);
    await gotoHealthy(viewerPage, '/app/reports');
    await expect(viewerPage.locator('body')).toContainText('Admin access required');
    await viewerContext.close();
  });
});
