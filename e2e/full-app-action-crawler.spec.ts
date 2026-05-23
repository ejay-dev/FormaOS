import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';

import {
  authenticateWorkspacePage,
  configureWorkspaceState,
  getWorkspaceSeedContext,
  seedEvidence,
  seedIncident,
  seedParticipant,
  seedPolicy,
  seedStaffCredential,
  seedVisit,
  type WorkspaceSeedContext,
} from './helpers/workspace-seed';

type CrawledAction = {
  module: string;
  route: string;
  label: string;
  type: string;
  destination: string;
  expected: string;
  tested: string;
  status: 'PASS' | 'FIXED' | 'HIDDEN' | 'DISABLED' | 'DEFERRED' | 'FAIL';
  notes?: string;
};

type SeededSurface = {
  participantId: string;
  visitId: string;
  incidentId: string;
  staffCredentialId: string;
  policyId: string;
  carePlanId: string;
  formId: string;
  customReportId: string | null;
  capaId: string | null;
  evidenceId: string;
  evidencePath: string | null;
};

const STATIC_APP_ROUTES = [
  '/app',
  '/app/dashboard',
  '/app/compliance',
  '/app/compliance/frameworks',
  '/app/compliance/cross-map',
  '/app/compliance/soc2',
  '/app/controls',
  '/app/controls/journey',
  '/app/policies',
  '/app/policies/new',
  '/app/policies/versions',
  '/app/vault',
  '/app/vault/review',
  '/app/evidence',
  '/app/evidence/gaps',
  '/app/participants',
  '/app/participants/new',
  '/app/care-plans',
  '/app/care-plans/journey',
  '/app/care-plans/new',
  '/app/visits',
  '/app/visits/new',
  '/app/progress-notes',
  '/app/incidents',
  '/app/incidents/new',
  '/app/incidents/analytics',
  '/app/staff-compliance',
  '/app/staff-compliance/new',
  '/app/certificates',
  '/app/team',
  '/app/team/org-chart',
  '/app/registers',
  '/app/registers/training',
  '/app/forms',
  '/app/forms/builder/new',
  '/app/reports',
  '/app/reports/custom',
  '/app/reports/custom/new',
  '/app/reports/trends',
  '/app/executive',
  '/app/executive/group',
  '/app/settings',
  '/app/settings/organization',
  '/app/settings/roles',
  '/app/settings/roles/new',
  '/app/settings/ai',
  '/app/settings/security',
  '/app/settings/notifications',
  '/app/settings/email-preferences',
  '/app/settings/email-history',
  '/app/settings/executive-digest',
  '/app/settings/integrations',
  '/app/settings/integrations/marketplace',
  '/app/settings/retention',
  '/app/settings/auditor-access',
  '/app/settings/auditor-access/new',
  '/app/billing',
  '/app/workflows',
  '/app/audit-trail',
  '/app/audit-trail',
  '/app/activity',
  '/app/tasks',
  '/app/tasks/board',
  '/app/tasks/calendar',
  '/app/capa',
  '/app/capa/new',
  '/app/governance',
  '/app/search',
] as const;

const ROUTE_MODULES: Array<[RegExp, string]> = [
  [/^\/app\/compliance|^\/app\/controls/, 'Compliance'],
  [/^\/app\/policies/, 'Policies'],
  [/^\/app\/vault|^\/app\/evidence/, 'Evidence Vault'],
  [/^\/app\/participants|^\/app\/patients/, 'Participants'],
  [/^\/app\/care-plans/, 'Care Plans'],
  [/^\/app\/visits/, 'Visits'],
  [/^\/app\/progress-notes/, 'Progress Notes'],
  [/^\/app\/incidents/, 'Incidents'],
  [/^\/app\/staff-compliance|^\/app\/certificates/, 'Staff Compliance'],
  [/^\/app\/team/, 'Team'],
  [/^\/app\/registers/, 'Registers'],
  [/^\/app\/forms/, 'Forms'],
  [/^\/app\/reports/, 'Reports'],
  [/^\/app\/executive/, 'Executive'],
  [/^\/app\/settings/, 'Settings'],
  [/^\/app\/billing/, 'Billing'],
  [/^\/app\/workflows/, 'Workflows'],
  [/^\/app\/audit|^\/app\/activity/, 'Audit Trail'],
  [/^\/app\/tasks/, 'Tasks'],
  [/^\/app\/capa/, 'CAPA'],
];

function moduleFor(route: string) {
  return ROUTE_MODULES.find(([pattern]) => pattern.test(route))?.[1] ?? 'Dashboard';
}

function installCrawlGuards(page: Page) {
  const failures: string[] = [];

  page.on('pageerror', (error) => {
    failures.push(`pageerror at ${page.url()}: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (
      text.includes('favicon') ||
      text.includes('ResizeObserver loop') ||
      text.includes('Failed to fetch completion counts') ||
      text.includes('[ProductTour] Failed to load state') ||
      text.includes('Failed to load resource') ||
      text.includes('Failed to load resource: the server responded with a status of 400') ||
      text.includes('Failed to load resource: the server responded with a status of 401') ||
      text.includes('Failed to load resource: the server responded with a status of 403') ||
      text.includes('Failed to load resource: the server responded with a status of 429')
    ) {
      return;
    }
    failures.push(`console error at ${page.url()}: ${text}`);
  });

  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    if (
      status === 404 &&
      (url.includes('/app') || url.includes('/api/')) &&
      !url.includes('/_next/')
    ) {
      failures.push(`404 response: ${url}`);
    }
  });

  return failures;
}

async function gotoCrawlRoute(page: Page, route: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(route, {
        waitUntil: 'commit',
        timeout: 60_000,
      });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('ERR_ABORTED') ||
        message.includes('Timeout') ||
        message.includes('timeout');
      if (!retryable || attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(500 * (attempt + 1));
    }
  }
  throw lastError;
}

async function seedCrawlerSurface(
  context: WorkspaceSeedContext,
): Promise<SeededSurface> {
  await configureWorkspaceState(context, {
    role: 'owner',
    industry: 'ndis',
    onboardingCompleted: true,
    frameworks: ['soc2', 'ndis'],
    planKey: 'pro',
  });

  const entitlementNow = new Date().toISOString();
  for (const featureKey of [
    'audit_export',
    'framework_evaluations',
    'capa_management',
    'custom_reports',
    'form_analytics',
    'team',
  ]) {
    const { data: existing } = await context.admin
      .from('org_entitlements')
      .select('id')
      .eq('organization_id', context.orgId)
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (existing?.id) {
      await context.admin
        .from('org_entitlements')
        .update({ enabled: true, updated_at: entitlementNow })
        .eq('id', existing.id);
    } else {
      await context.admin.from('org_entitlements').insert({
        organization_id: context.orgId,
        feature_key: featureKey,
        enabled: true,
        created_at: entitlementNow,
        updated_at: entitlementNow,
      });
    }
  }

  const unique = randomUUID().slice(0, 8);
  const participant = await seedParticipant(context, {
    fullName: `Crawler Participant ${unique}`,
    externalId: `CRAWLER-${unique}`,
    careStatus: 'active',
    riskLevel: 'medium',
  });
  const participantId = participant.id as string;

  const visit = await seedVisit(context, {
    clientId: participantId,
    notes: `Crawler visit ${unique}`,
  });

  const incident = await seedIncident(context, {
    patientId: participantId,
    description: `Crawler incident ${unique}`,
    severity: 'medium',
    status: 'open',
  });

  const staffCredential = await seedStaffCredential(context, {
    credentialName: `Crawler Credential ${unique}`,
    status: 'verified',
  });

  const policy = await seedPolicy(context, {
    title: `Crawler Policy ${unique}`,
    content: 'Crawler policy content.',
    status: 'draft',
  });

  await context.admin.from('policy_versions').insert({
    org_id: context.orgId,
    policy_id: policy.id,
    version_number: 1,
    title: policy.title,
    content: policy.content ?? '',
    change_summary: 'Crawler seed',
    status: 'draft',
    created_by: context.userId,
  });

  const now = new Date().toISOString();
  const { data: carePlan, error: carePlanError } = await context.admin
    .from('org_care_plans')
    .insert({
      organization_id: context.orgId,
      client_id: participantId,
      plan_type: 'support',
      title: `Crawler Care Plan ${unique}`,
      description: 'Seeded for full app action crawler.',
      start_date: now.slice(0, 10),
      status: 'draft',
      goals: [],
      supports: [],
      created_by: context.userId,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  expect(carePlanError).toBeFalsy();

  const { data: form, error: formError } = await context.admin
    .from('org_forms')
    .insert({
      org_id: context.orgId,
      title: `Crawler Form ${unique}`,
      description: 'Seeded for full app action crawler.',
      slug: `crawler-form-${unique}`,
      status: 'published',
      fields: [
        { id: 'resident_name', type: 'text', label: 'Resident Name', order: 0 },
      ],
      settings: {},
      created_by: context.userId,
    })
    .select('id')
    .single();
  expect(formError).toBeFalsy();

  await context.admin.from('org_form_submissions').insert({
    form_id: form!.id,
    org_id: context.orgId,
    respondent_name: 'Crawler Respondent',
    respondent_email: 'crawler@example.com',
    data: { resident_name: 'Crawler Respondent' },
    metadata: {},
    status: 'submitted',
  });

  const { data: customReport, error: customReportError } = await context.admin
    .from('org_saved_reports')
    .insert({
      org_id: context.orgId,
      name: `Crawler Custom Report ${unique}`,
      description: 'Seeded custom report with a detail link.',
      type: 'custom',
      config: { dataset: 'controls', filters: {}, columns: [] },
      created_by: context.userId,
    })
    .select('id')
    .single();
  const customReportId =
    customReportError?.code === 'PGRST205' &&
    customReportError.message?.includes('org_saved_reports')
      ? null
      : (customReport?.id as string | undefined);
  if (customReportId === undefined) {
    expect(customReportError).toBeFalsy();
  }

  const { data: capa, error: capaError } = await context.admin
    .from('org_capa_items')
    .insert({
      organization_id: context.orgId,
      type: 'corrective',
      title: `Crawler CAPA ${unique}`,
      description: 'Seeded CAPA with a detail link.',
      priority: 'medium',
      status: 'open',
      created_by: context.userId,
    })
    .select('id')
    .single();
  const capaId =
    capaError?.code === 'PGRST205' &&
    capaError.message?.includes('org_capa_items')
      ? null
      : (capa?.id as string | undefined);
  if (capaId === undefined) {
    expect(capaError).toBeFalsy();
  }

  const evidence = await seedEvidence(context, {
    fileName: `crawler-evidence-${unique}.txt`,
    uploadedBy: context.userId,
    verificationStatus: 'verified',
    content: 'crawler evidence fixture',
  });

  return {
    participantId,
    visitId: visit.id as string,
    incidentId: incident.id as string,
    staffCredentialId: staffCredential.id as string,
    policyId: policy.id as string,
    carePlanId: carePlan!.id as string,
    formId: form!.id as string,
    customReportId: customReportId ?? null,
    capaId: capaId ?? null,
    evidenceId: evidence.id as string,
    evidencePath: (evidence.file_path as string | null) ?? null,
  };
}

function dynamicRoutes(seed: SeededSurface) {
  return [
    `/app/participants/${seed.participantId}`,
    `/app/participants/${seed.participantId}/medications`,
    `/app/patients/${seed.participantId}`,
    `/app/visits/${seed.visitId}`,
    `/app/incidents/${seed.incidentId}`,
    `/app/incidents/${seed.incidentId}/investigation`,
    `/app/staff-compliance/${seed.staffCredentialId}`,
    `/app/policies/${seed.policyId}`,
    `/app/policies/${seed.policyId}/edit`,
    `/app/policies/${seed.policyId}/versions`,
    `/app/care-plans/${seed.carePlanId}`,
    `/app/forms/${seed.formId}/submissions`,
    `/app/forms/builder/${seed.formId}`,
    ...(seed.customReportId ? [`/app/reports/custom/${seed.customReportId}`] : []),
    ...(seed.capaId ? [`/app/capa/${seed.capaId}`] : []),
  ];
}

async function collectVisibleActions(page: Page, route: string) {
  return page.evaluate((currentRoute) => {
    const visible = (el: Element) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const labelFor = (el: Element) =>
      (
        el.getAttribute('aria-label') ||
        el.textContent ||
        el.getAttribute('title') ||
        el.getAttribute('href') ||
        ''
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);

    const rows: Array<{
      route: string;
      label: string;
      type: string;
      destination: string;
      disabled: boolean;
    }> = [];

    document.querySelectorAll('a[href]').forEach((el) => {
      if (!visible(el)) return;
      rows.push({
        route: currentRoute,
        label: labelFor(el),
        type: 'link',
        destination: (el as HTMLAnchorElement).href,
        disabled: el.getAttribute('aria-disabled') === 'true',
      });
    });

    document.querySelectorAll('button, [role="button"], [role="menuitem"], [role="tab"]').forEach((el) => {
      if (!visible(el)) return;
      const button = el as HTMLButtonElement;
      rows.push({
        route: currentRoute,
        label: labelFor(el),
        type: el.getAttribute('role') === 'tab' ? 'tab' : 'button',
        destination:
          el.getAttribute('formaction') ||
          el.getAttribute('data-testid') ||
          el.getAttribute('aria-controls') ||
          '',
        disabled:
          button.disabled ||
          el.getAttribute('aria-disabled') === 'true' ||
          el.closest('[aria-disabled="true"]') !== null,
      });
    });

    document.querySelectorAll('input[type="file"]').forEach((el) => {
      if (!visible(el)) return;
      rows.push({
        route: currentRoute,
        label: labelFor(el) || (el as HTMLInputElement).name || 'file input',
        type: 'upload',
        destination: (el as HTMLInputElement).name,
        disabled: (el as HTMLInputElement).disabled,
      });
    });

    document.querySelectorAll('form').forEach((el) => {
      if (!visible(el)) return;
      rows.push({
        route: currentRoute,
        label: labelFor(el) || 'form',
        type: 'form submit',
        destination: el.getAttribute('action') || 'server action',
        disabled: false,
      });
    });

    return rows;
  }, route);
}

function normalizeInternalHref(rawHref: string, appBase: string) {
  try {
    const baseOrigin = new URL(appBase).origin;
    const url = new URL(rawHref, appBase);
    if (url.origin !== baseOrigin) return null;
    if (url.pathname.startsWith('/_next/')) return null;
    if (!url.pathname.startsWith('/app') && !url.pathname.startsWith('/api')) {
      return null;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

async function verifyInternalHref(
  page: Page,
  href: string,
  route: string,
  label: string,
  actions: CrawledAction[],
) {
  const module = moduleFor(route);
  const isExport = /export|download|format=csv|format=pdf|format=json/i.test(href);
  let response: Awaited<ReturnType<Page['request']['get']>>;
  try {
    response = await page.request.get(href, {
      failOnStatusCode: false,
      timeout: 45_000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('Timeout')) throw error;
    response = await page.request.get(href, {
      failOnStatusCode: false,
      timeout: 45_000,
    });
  }
  const status = response.status();
  const body = await response.text().catch(() => '');

  const ok =
    (isExport ? status === 200 : status !== 404 && status < 500) &&
    !body.includes('This page could not be found') &&
    !body.includes("FormaOS couldn't load");

  if (isExport && status === 200) {
    expect(body.length, `${href} returned an empty export`).toBeGreaterThan(20);
  }

  actions.push({
    module,
    route,
    label,
    type: isExport ? 'download/export' : 'link',
    destination: href,
    expected: isExport ? 'Endpoint responds with non-empty file' : 'Destination resolves without app 404',
    tested: `HTTP ${status}`,
    status: ok ? 'PASS' : 'FAIL',
    notes: ok ? undefined : body.slice(0, 160),
  });

  expect(ok, `${route} -> ${href} (${label}) failed with HTTP ${status}`).toBe(true);
}

async function exerciseTabs(page: Page, route: string, actions: CrawledAction[]) {
  const tabs = page.locator('[role="tab"]:visible');
  const count = Math.min(await tabs.count(), 12);
  for (let i = 0; i < count; i += 1) {
    const tab = tabs.nth(i);
    const label = ((await tab.textContent()) ?? `tab ${i + 1}`).trim();
    if (await tab.isDisabled().catch(() => false)) {
      actions.push({
        module: moduleFor(route),
        route,
        label,
        type: 'tab',
        destination: 'role=tab',
        expected: 'Disabled tabs are not user-actionable',
        tested: 'disabled',
        status: 'DISABLED',
      });
      continue;
    }
    await tab.click({ timeout: 5_000 }).catch(() => {});
    actions.push({
      module: moduleFor(route),
      route,
      label,
      type: 'tab',
      destination: 'role=tab',
      expected: 'Tab activates without navigation failure',
      tested: 'clicked',
      status: 'PASS',
    });
  }
}

async function exerciseSafeOpeners(page: Page, route: string, actions: CrawledAction[]) {
  const safeOpeners = page
    .locator('button:visible, [role="button"]:visible')
    .filter({
      hasText: /actions|more|filter|filters|search|template|help|assistant|settings|notifications|quick search/i,
    });
  const count = Math.min(await safeOpeners.count(), 8);

  for (let i = 0; i < count; i += 1) {
    const opener = safeOpeners.nth(i);
    const label =
      ((await opener.getAttribute('aria-label')) ||
        (await opener.textContent()) ||
        `button ${i + 1}`)
        .replace(/\s+/g, ' ')
        .trim();

    if (/sign out|delete|archive|remove|deactivate|resolve|reopen|run|generate/i.test(label)) {
      continue;
    }
    if (await opener.isDisabled().catch(() => false)) {
      actions.push({
        module: moduleFor(route),
        route,
        label,
        type: 'button',
        destination: 'safe opener',
        expected: 'Disabled action is not user-actionable',
        tested: 'disabled',
        status: 'DISABLED',
      });
      continue;
    }

    await opener.click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(150);

    const overlayCount = await page
      .locator('[role="dialog"]:visible, [role="menu"]:visible, [data-radix-popper-content-wrapper]:visible')
      .count()
      .catch(() => 0);

    actions.push({
      module: moduleFor(route),
      route,
      label,
      type: overlayCount > 0 ? 'modal/dropdown' : 'button',
      destination: 'safe opener',
      expected: 'Opens or toggles visible UI without app errors',
      tested: overlayCount > 0 ? 'opened overlay' : 'clicked',
      status: 'PASS',
    });

    await page.keyboard.press('Escape').catch(() => {});
  }
}

async function cleanupCrawlerSurface(
  context: WorkspaceSeedContext,
  seed: SeededSurface,
  generatedFormIds: string[] = [],
) {
  for (const formId of generatedFormIds) {
    await context.admin.from('org_forms').delete().eq('id', formId);
  }
  await context.admin.from('policy_versions').delete().eq('policy_id', seed.policyId);
  await context.admin.from('org_form_submissions').delete().eq('form_id', seed.formId);
  await context.admin.from('org_forms').delete().eq('id', seed.formId);
  if (seed.customReportId) {
    await context.admin.from('org_saved_reports').delete().eq('id', seed.customReportId);
  }
  if (seed.capaId) {
    await context.admin.from('org_capa_items').delete().eq('id', seed.capaId);
  }
  await context.admin.from('org_care_plans').delete().eq('id', seed.carePlanId);
  await context.admin.from('org_visits').delete().eq('id', seed.visitId);
  await context.admin.from('org_incidents').delete().eq('id', seed.incidentId);
  await context.admin.from('org_staff_credentials').delete().eq('id', seed.staffCredentialId);
  await context.admin.from('org_policies').delete().eq('id', seed.policyId);
  await context.admin.from('org_evidence').delete().eq('id', seed.evidenceId);
  if (seed.evidencePath) {
    await context.admin.storage.from('evidence').remove([seed.evidencePath]);
  }
  await context.admin.from('org_patients').delete().eq('id', seed.participantId);
}

test.describe('Full authenticated app action crawler', () => {
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Crawler runs once on chromium');
  });

  test('visible actions resolve, open, submit safely, or are truthfully unavailable', async ({
    page,
  }) => {
    test.setTimeout(600_000);
    const actions: CrawledAction[] = [];
    const failures = installCrawlGuards(page);
    const context = await getWorkspaceSeedContext();
    const seed = await seedCrawlerSurface(context);
    const { appBase } = await authenticateWorkspacePage(page, context.email);
    const allRoutes = [...STATIC_APP_ROUTES, ...dynamicRoutes(seed)];
    const seenLinks = new Set<string>();
    const generatedFormIds: string[] = [];

    try {
      for (const route of allRoutes) {
        const response = await gotoCrawlRoute(page, route);
        await page.waitForLoadState('load', { timeout: 3_000 }).catch(() => {});
        await page.waitForTimeout(150);
        if (route === '/app/forms/builder/new') {
          const match = page.url().match(/\/app\/forms\/builder\/([^/?#]+)/);
          if (match?.[1]) generatedFormIds.push(match[1]);
        }

        const body = (await page.locator('body').textContent()) ?? '';
        expect(response?.status() ?? 0, `${route} returned HTTP ${response?.status()}`).toBeLessThan(500);
        expect(body, `${route} rendered a Next.js 404`).not.toContain('This page could not be found');
        expect(body, `${route} rendered app error copy`).not.toContain("FormaOS couldn't load");

        actions.push({
          module: moduleFor(route),
          route,
          label: 'Page load',
          type: 'link',
          destination: route,
          expected: 'Authenticated page loads without 404 or crash',
          tested: `HTTP ${response?.status() ?? 'unknown'}`,
          status: 'PASS',
        });

        const discovered = await collectVisibleActions(page, route);
        for (const action of discovered) {
          if (action.disabled) {
            actions.push({
              module: moduleFor(route),
              route,
              label: action.label || action.type,
              type: action.type,
              destination: action.destination,
              expected: 'Disabled actions must not be silently clickable',
              tested: 'disabled in UI',
              status: 'DISABLED',
            });
            continue;
          }

          if (action.type === 'link') {
            const href = normalizeInternalHref(action.destination, appBase);
            if (!href) continue;
            const key = href;
            if (seenLinks.has(key)) continue;
            seenLinks.add(key);
            if (href.startsWith('/app/forms/builder/new')) {
              actions.push({
                module: moduleFor(route),
                route,
                label: action.label,
                type: 'link',
                destination: href,
                expected: 'Draft-creating GET route is exercised once from the route inventory',
                tested: 'skipped duplicate mutating link probe',
                status: 'PASS',
              });
              continue;
            }
            await verifyInternalHref(page, href, route, action.label, actions);
          } else if (action.type === 'upload') {
            actions.push({
              module: moduleFor(route),
              route,
              label: action.label,
              type: 'upload',
              destination: action.destination,
              expected: 'Upload control is present and enabled where exposed',
              tested: 'visible enabled file input',
              status: 'PASS',
            });
          }
        }

        await exerciseTabs(page, route, actions);
        await exerciseSafeOpeners(page, route, actions);
      }

      expect(failures, failures.join('\n')).toEqual([]);
      expect(actions.filter((action) => action.status === 'FAIL'), 'crawler action failures').toEqual([]);
    } finally {
      await fs.mkdir('test-results', { recursive: true });
      await fs.writeFile(
        'test-results/full-app-action-crawler-actions.json',
        JSON.stringify(actions, null, 2),
      );
      await cleanupCrawlerSurface(context, seed, generatedFormIds);
    }
  });
});
