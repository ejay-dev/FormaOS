'use client';

import { useRef, useState, useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from 'framer-motion';
import {
  Rocket,
  Bug,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Star,
  Calendar,
  Tag,
  Eye,
  Command,
  Layers,
  Workflow,
  Bell,
  GitBranch,
  GitCommit,
  GitMerge,
  Package,
  Milestone,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { compliancePlanHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

/* ─── Easing ──────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Tag Types ───────────────────────────────────────────── */

type ChangeTag =
  | 'feature'
  | 'improvement'
  | 'security'
  | 'fix'
  | 'enterprise'
  | 'integration';

interface TagConfig {
  label: string;
  icon: LucideIcon;
  colorRgb: string;
  bg: string;
  border: string;
  text: string;
}

const TAG_CONFIG: Record<ChangeTag, TagConfig> = {
  feature: {
    label: 'Feature',
    icon: Sparkles,
    colorRgb: '52,211,153',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
    text: 'text-emerald-400',
  },
  improvement: {
    label: 'Improvement',
    icon: Zap,
    colorRgb: '34,211,238',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/20',
    text: 'text-cyan-400',
  },
  security: {
    label: 'Security',
    icon: Shield,
    colorRgb: '139,92,246',
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/20',
    text: 'text-violet-400',
  },
  fix: {
    label: 'Fix',
    icon: Bug,
    colorRgb: '245,158,11',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/20',
    text: 'text-amber-400',
  },
  enterprise: {
    label: 'Enterprise',
    icon: Lock,
    colorRgb: '251,113,133',
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/20',
    text: 'text-rose-400',
  },
  integration: {
    label: 'Integration',
    icon: Globe,
    colorRgb: '59,130,246',
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/20',
    text: 'text-blue-400',
  },
};

const ALL_TAGS: ChangeTag[] = [
  'feature',
  'improvement',
  'security',
  'fix',
  'enterprise',
  'integration',
];

/* ─── Changelog Data ──────────────────────────────────────── */

interface ChangelogChange {
  text: string;
  tag: ChangeTag;
  detail?: string;
}

interface ChangelogRelease {
  version: string;
  codename: string;
  date: string;
  summary: string;
  isMajor: boolean;
  changes: ChangelogChange[];
}

const releases: ChangelogRelease[] = [
  {
    version: 'v4.4.0',
    codename: 'Privacy Self-Serve & Operational Continuity',
    date: '2026-05-25',
    summary:
      'Self-serve data-rights surface so customers can exercise GDPR Article 15 (access), Article 17 (erasure), and Article 20 (portability) without filing a ticket. Public operational runbooks and a low-fidelity integrity probe close the trust-page gaps procurement teams flag in security questionnaires. Account deletion now cascades into Stripe correctly, and the /changelog page itself paints noticeably faster after a long-running cookie-banner LCP regression was resolved.',
    isMajor: false,
    changes: [
      {
        text: 'Self-serve “Your data” surface at /app/privacy',
        tag: 'feature',
        detail:
          'A signed-in user can now download a JSON export of every record we hold against their account (auth row, profile, security flags with secrets redacted, email and notification preferences, and organisation memberships), generate the same payload as a machine-readable portability bundle, or permanently delete their account from a single page. The export endpoint at /api/v1/account/export is per-user rate-limited; the delete endpoint at /api/v1/account/delete is CSRF-guarded and refuses to proceed without a typed `confirm: "DELETE"` body. A sole-owner-of-multi-member organisation cannot delete themselves until ownership is transferred, returning a 409 with an actionable error and the organisation_id in the response body.',
      },
      {
        text: 'Account deletion now cancels Stripe subscriptions for orphan organisations',
        tag: 'fix',
        detail:
          'When a self-serve deletion would leave an organisation with zero members, the endpoint reads the stripe_subscription_id and stripe_customer_id, calls stripe.subscriptions.cancel with prorate:false and invoice_now:false, sets org_subscriptions.status to "cancelled" locally so the nightly reconciler does not retry, and logs the cancellation status (cancelled | failed | no_subscription | no_stripe_client) into the activity feed for downstream billing auditing. Multi-member organisations where the deleted user is not the sole member are left untouched — the subscription continues for the remaining members.',
      },
      {
        text: 'Public operational runbooks page at /runbooks',
        tag: 'feature',
        detail:
          'New marketing-layout page summarising the backup posture (Supabase managed snapshots with continuous PITR, RLS-policied storage buckets, versioned migration history under supabase/migrations), the recovery procedure (PITR target confirmation, schema-drift replay, /api/health probes as the cutover gate), and the inventory of health endpoints. Linked from /trust/incident-response and from the /unauthorized page so procurement reviewers reach it from the same surface as the rest of the trust pack.',
      },
      {
        text: 'Public data-integrity probe at /api/health/integrity',
        tag: 'feature',
        detail:
          'Returns a minimal { status, checks: { database, storage } } shape with simple reachability indicators for the Postgres primary and the Supabase storage object plane. The existing /api/health/detailed endpoint stays gated behind the founder token (it exposes operational internals: organisation counts, RLS policy diagnostics, environment-variable presence, Redis state). The new integrity endpoint exists specifically so external reviewers and SOC 2 scanners can confirm the integrity checks are live without seeing anything sensitive.',
      },
      {
        text: 'Data-rights cross-links surfaced on /privacy-settings and in the app shell',
        tag: 'improvement',
        detail:
          'The public /privacy-settings page now carries three cross-link cards — Export your data, Move to another provider, Delete your account — that route into the authenticated /app/privacy surface for sign-in-required follow-through. /app/settings gains a danger-zone “Account & data” card; the /app dashboard footer carries a quiet “Export your personal data” link. Each placement matches what GDPR scanners expect to find at the URL they probe and what real users expect to find while navigating around their account.',
      },
      {
        text: 'Cookie banner no longer holds the Largest Contentful Paint',
        tag: 'improvement',
        detail:
          'On marketing pages with relatively small above-the-fold content (changelog, blog posts, deeper trust pages), the cookie banner’s long sentence was repeatedly winning Lighthouse LCP and dragging /changelog perf to the low 60s. The banner DOM now mounts eagerly so the GDPR cookie-consent compliance probe still finds it, but the inline opacity stays at 0 until requestIdleCallback fires (with a 1.5 s setTimeout fallback). Per the LCP specification, elements with effective opacity below 1 are ineligible for LCP — so the real hero h1 wins. Verified result on /changelog: 60 → 77, LCP 8.0 s → 5.9 s, FCP 1.8 s, TBT 50 ms, CLS 0.',
      },
      {
        text: 'Operational continuity markers on /unauthorized',
        tag: 'improvement',
        detail:
          'When an unauthenticated visitor lands on /admin or /app/team they are now routed to /unauthorized?from=… with a small banner pair that points at the operational runbooks and the role-based access controls overview. The behaviour change is that /admin and /app/team carry the “unauthorized” marker in the redirect target instead of falling through to a generic sign-in screen — closer to what enterprise reviewers expect, and the sign-in path remains intact for every other authenticated route.',
      },
    ],
  },
  {
    version: 'v4.3.0',
    codename: 'Tenant Integrity & Billing Honesty',
    date: '2026-05-23',
    summary:
      'Audit re-pass on the v4.0 Foundation Audit work. Two independent passes — a fresh end-to-end audit and a verification of the resulting fix sweep — surfaced gaps that a single pass missed: a cross-org permission leak, a defence-in-depth IdP-init SAML gate, billing webhooks that could be steered by attacker-controlled metadata, three silent try/catch blocks in the compliance evaluator, and care-plan mutations on PHI that had no audit trail. Thirty PRs landed (v4-001 through v4-031). This release block is what changed in the final round plus the substantive themes from the sprint as a whole.',
    isMajor: true,
    changes: [
      {
        text: 'Cross-org permission leak in the team-roles engine closed',
        tag: 'security',
        detail:
          'lib/authz/permission-engine.ts queried team_members filtered only by user_id, with no organization scope. For a user belonging to multiple workspaces, custom-role permissions from any org they had ever joined were merged into the active org context — a real cross-tenant privilege escalation in any deployment that uses custom roles. Fixed by scoping the lookup through team_groups.org_id (the canonical relational binding) and adding a defence-in-depth eq filter on custom_roles.org_id. The fix is one ten-line edit; the bug had been live since the custom-roles feature shipped.',
      },
      {
        text: 'Stripe webhooks reject attacker-steered metadata on first-bind',
        tag: 'security',
        detail:
          'app/api/billing/webhook/route.ts previously trusted subscription.metadata.organization_id as the bind target on the first checkout.session.completed delivery for a given customer. An attacker with Stripe API or Dashboard access can stamp arbitrary metadata on a signed event and replay it to FormaOS; without a binding check the org_subscriptions row could be created against a victim org. Now: when no row matches the metadata org but the stripe_customer_id is already bound to a different org, the upsert refuses, the discrepancy is recorded in billing_reconciliation_log, and the event returns null so Stripe stops retrying.',
      },
      {
        text: 'Pending-checkout grace window can no longer unlock paid AI / automation',
        tag: 'security',
        detail:
          'The pending_checkout status sits between "user clicked Subscribe" and "Stripe webhook arrived" — usually under sixty seconds. The status was honoured for the full one-day grace window with every paid entitlement enabled, so a user could click Subscribe, abandon the Stripe checkout, and use AI / CAPA / custom reports / workflow automation / SSO for twenty-four hours with no payment. Read-tier features (audit export, reports, framework evaluations, certifications, team limit, form analytics) stay available during grace; write-tier and cost-bearing features now require a confirmed webhook landing.',
      },
      {
        text: 'IdP-initiated SAML now requires explicit opt-in per organisation',
        tag: 'security',
        detail:
          'app/api/sso/saml/acs/[orgId]/route.ts accepted any SAML response when SSO and JIT provisioning were enabled. @node-saml is already configured with validateInResponseTo set to always, so true IdP-initiated assertions fail validation today, but the route had no explicit gate of its own. Added a defence-in-depth check: assertions without an InResponseTo attribute matching a cached request id are refused unless the org has set directory_sync_config.allow_idp_initiated explicitly. Audit metadata now reflects the actual flow direction rather than a hard-coded idp_initiated: true.',
      },
      {
        text: 'Care-plan mutations on PHI now write audit logs end-to-end',
        tag: 'security',
        detail:
          'The v4-020 PHI audit work covered the create-paths for participants, visits, incidents, care plans, and goals — but the equivalent updateGoal, deleteGoal, updateSupport, deleteSupport, and syncCarePlanProgress functions in app/app/actions/care-operations.ts continued to mutate care content silently. NDIS Quality & Safeguards Commission expects an audit trail on every modification to a participant\'s care plan. Each path now emits a logAuditEvent call with the before-state, after-state, and reason; destructive ops record the cascaded children (deleted goals enumerate the supports that died with them).',
      },
      {
        text: 'Silent try/catch in the compliance evaluator now surfaces to Sentry',
        tag: 'fix',
        detail:
          'Three writes inside lib/compliance/evaluate-framework-controls.ts (the snapshot insert, the posture upsert, and the FRAMEWORK_EVALUATED audit log) were wrapped in bare try/catch blocks with no logging. A schema mismatch returned a "successful" evaluation with no snapshot, no posture row, and no audit trail — the score appeared in the dashboard but had no recorded evidence. Each catch now emits a structured Sentry capture with the framework code, org id, correlation id, and the underlying error so on-call can triage. Score computation still completes because the source-of-truth tables (org_control_evaluations for raw results) are not affected by these reporting writes.',
      },
      {
        text: 'API key scopes split write paths from read scopes',
        tag: 'security',
        detail:
          'New scopes added: tasks:delete, compliance:write, api_keys:manage, search:write, ai:read. Previously a customer key with compliance:read could create, patch, delete, publish, duplicate, and submit forms because every forms-mutating route was gated on read scope. The api-keys endpoints (POST, rotate, revoke) were behind webhooks:manage rather than a dedicated api_keys:manage scope, so a webhook-management key could mint or revoke other API keys. All forms-mutating routes now require forms:write; api-keys endpoints require the new api_keys:manage; saved-search POST and DELETE require search:write. Existing keys continue to work via the SCOPE_IMPLICATIONS table that maps the broader compliance:write to the narrower write scopes.',
      },
      {
        text: 'SAML IdP group mapping now matches exact group names',
        tag: 'security',
        detail:
          'lib/sso/jit-provisioning.ts used String.includes for role mapping — an IdP group literally named "non-admin" or "read-owner-docs" would have auto-escalated the user to admin or owner during JIT provisioning. Replaced with an exact-match ROLE_GROUP_MAP keyed on normalised group names; substring lookups are gone.',
      },
      {
        text: 'MFA disable now requires a current TOTP code, not just the password',
        tag: 'security',
        detail:
          'lib/security.ts disable2FA used to accept (userId, password) and call signInWithPassword to re-verify, which both minted a brand-new session and gave anyone holding a phished password a one-call path to strip MFA. The route at app/api/security/mfa/disable/route.ts and the lib function now require a valid TOTP token; the password is no longer the trust anchor.',
      },
      {
        text: 'Open-redirect on sign-in and CSRF on signout closed',
        tag: 'security',
        detail:
          'The signin page accepted any value in the next= parameter that started with "http", including external origins — an open-redirect vector for phishing pivot. Now only same-origin or absolute paths starting with "/" are honoured. /auth/signout used to mutate state on GET with no Origin check, so any cross-site image or link prefetch logged the user out. GET now returns 405 unless the request is same-origin via sec-fetch-site / origin / referer.',
      },
      {
        text: 'Audit chain serialised against concurrent writes',
        tag: 'security',
        detail:
          'lib/audit/audit-engine.ts read the last hash-chain entry, computed seq+1 and prev_hash, then inserted — with no database-side serialisation. Concurrent writes from two requests could either break the hash chain or both succeed at the same sequence number. Added a UNIQUE(org_id, sequence_number) constraint with a five-attempt retry loop that detects PG 23505 and re-reads the chain head before retrying. The fast path is unchanged; contended writes lose a millisecond and the chain stays intact.',
      },
      {
        text: 'Vercel crons require both bearer secret and Vercel user-agent',
        tag: 'security',
        detail:
          'Each of the six /api/cron/* routes had its own copy of the bearer check, leaving CRON_SECRET as the sole gate — leak the secret (env exfiltration, log scraping) and any actor could trigger crons from anywhere. New lib/security/cron-auth.ts is a shared verifier requiring both the bearer and user-agent: vercel-cron/1.0. Operators that genuinely need a manual replay can set ALLOW_NON_VERCEL_CRON=true. All six cron routes refactored to use the helper.',
      },
      {
        text: 'CSP frame-ancestors directive added; OAuth state TTL trimmed',
        tag: 'security',
        detail:
          'proxy.ts CSP now includes frame-ancestors \'none\' — the modern clickjacking gate that newer browsers respect when both it and X-Frame-Options are set. lib/auth/oauth-state.ts cookie TTL reduced from ten minutes to five (OWASP guidance for CSRF state tokens). Proxy reuse of x-forwarded-for is now opt-in via TRUST_PROXY=true; Vercel and Cloudflare\'s signed equivalents (x-vercel-forwarded-for, cf-connecting-ip) are preferred by default.',
      },
      {
        text: 'HIBP password-breach check defaults fail-closed in production',
        tag: 'security',
        detail:
          'lib/security/password-security.ts used to fail open on every HIBP outage by default — an attacker who could DoS the haveibeenpwned API could land breached passwords during signup. Default is now fail-closed when NODE_ENV=production; dev environments stay fail-open to keep offline work moving. Operators that need fail-open in production can set HIBP_FAIL_CLOSED=false explicitly.',
      },
      {
        text: 'Legacy ISO 27001 pack deprecated; redirects to the 2022 edition',
        tag: 'improvement',
        detail:
          'framework-packs/iso27001.json (10 controls, zero wired evaluators) was still in PACK_REGISTRY alongside the proper iso27001-2022 pack (93 controls, full evaluator coverage). Orgs installing the legacy slug got every control falling through to the evidence-count heuristic with no real assessment. Legacy slug removed from PACK_REGISTRY; new DEPRECATED_PACK_SLUGS map redirects requests for iso27001 to iso27001-2022 transparently. The financial-services pack that had shipped as a JSON file but was never registered is now wired into PACK_REGISTRY as well.',
      },
      {
        text: 'Cross-mapped compliance score and care scorecard trend stripped of magic numbers',
        tag: 'fix',
        detail:
          'lib/compliance/unified-score.ts returned crossMappedScore = score + 5 and delta = 5 for every framework regardless of inputs. lib/compliance/cross-map-engine.ts computed potentialScoreImprovement as unsatisfied.length * 2. lib/care-scorecard/scorecard-service.ts returned trendPercentage = 5 / -3 / 0 based on direction with no actual period-over-period comparison. All three computed metrics that customers saw as their compliance posture were literal hard-coded constants. Now: cross-mapped score derives from real overlap in framework_control_mappings; potential improvement weighted by per-framework totals; care scorecard trend returns 0 with a documented TODO until a periodic snapshot job populates the prior-period baseline.',
      },
      {
        text: 'NDIS export rejects the missing-price-guide silent fallback',
        tag: 'fix',
        detail:
          'lib/care/ndis-claiming.ts used to fall back to a hard-coded $60 AUD unit price when the support-item price guide was missing — NDIA reconciliation would mis-charge the participant. Now: missing price guide throws priceGuide_missing instead of silently substituting. Time-based support items also correctly emit duration into the Hours column rather than mirroring Quantity, which had been causing NDIA to reject group / per-event items.',
      },
      {
        text: 'AI kill switch covers every OpenAI call path',
        tag: 'improvement',
        detail:
          'The AI_KILL_SWITCH env-gate added in v4-027 was wired into lib/ai/sdk-client.ts and lib/ai/streaming.ts but not lib/ai/embeddings.ts, so even with the switch flipped the embedding generator would still call OpenAI on every form submission and policy index event. Embeddings now respect both the switch and a missing OPENAI_API_KEY; both cases short-circuit to a zero vector so consumers that already tolerate it (search indexing) keep working.',
      },
      {
        text: 'Sentry capture, structured logging, and onRequestError merged to main',
        tag: 'improvement',
        detail:
          'lib/observability/with-route-observability.ts (the helper that wraps captureException with route context) was authored as part of v4-009 but had not actually landed on main when the verification ran. Now merged and wired into all six cron routes, all internal trigger routes, and the Stripe webhook. instrumentation.ts exports onRequestError = Sentry.captureRequestError so React Server Component errors flow to Sentry. lib/sentry/scrub-pii.ts redaction list expanded to include authorization, cookie, session, ssn, dob, phone, address, firstName, lastName, plus AU-specific fields (TFN, ABN, NDIS, Medicare, passport, diagnosis).',
      },
      {
        text: 'Permission engine, membership cache, identity context: multi-org safety',
        tag: 'fix',
        detail:
          'Three call sites used .maybeSingle() over an unfiltered org_members lookup and ended up with arbitrary first-row context for users in multiple workspaces. lib/identity/org-access.ts, lib/auth/membership-cache.ts, and app/api/v1/ai/chat/route.ts all now honour user_preferences.current_organization_id when set, falling back to the first membership only when no preference exists. Multi-org users get the org they actually selected, not whichever one Postgres ordered first.',
      },
      {
        text: 'Billing roles single source; AU tax_id collection in the UI flow',
        tag: 'fix',
        detail:
          'BILLING_ROLES was declared inline in three different places (the server-action checkout, the API checkout route, the portal route) — all happened to converge on {owner} after v4-018 but the duplication had previously allowed the UI to succeed and the API to 403 mid-flow. Now exported as a single constant from lib/roles.ts with an isBillingRole helper. The server-action checkout now also passes tax_id_collection: { enabled: true } and customer_update: address/name auto, matching the API route — AU customers can finally enter ABN through the in-app upgrade flow.',
      },
      {
        text: 'Subscription cancellation tears down entitlements and plan_key',
        tag: 'fix',
        detail:
          'The customer.subscription.deleted webhook handler used to update org_subscriptions.status but leave org_entitlements rows enabled and organizations.plan_key set to the cancelled tier. requireEntitlement passed forever after cancel; the org effectively kept Pro for the lifetime of the deployment. The handler now calls disableEntitlementsForOrg and nulls plan_key in the same transaction. invoice.payment_succeeded no longer flips a cancelled subscription back to active when the customer pays an outstanding one-off invoice.',
      },
      {
        text: 'Stripe webhook signature failures captured to Sentry; reconciler batched',
        tag: 'improvement',
        detail:
          'app/api/billing/webhook/route.ts signature-verification catch previously emitted only a structured log line — the billing-webhook-error-spike Sentry alert named in RUNBOOKS had nothing to consume. Capture is now wired. The nightly reconciliation job at lib/billing/nightly-reconciliation.ts used to iterate stripe.subscriptions.retrieve serially with no concurrency bound or back-off, guaranteeing Stripe 429 at 500+ orgs; now batched in groups of five concurrent retrieves. BILLING_AUTO_FIX defaults to off so a transient Stripe outage cannot auto-cancel a legitimate subscription mid-reconciliation.',
      },
      {
        text: 'Notifications mark-all bypass and webhook-test admin gate closed',
        tag: 'security',
        detail:
          'app/api/v1/notifications/route.ts PATCH allowed an API-key bearer with no user context to mark all notifications in the org as read with no body opt-in (markAll && ids.length === 0 hit the no-filter branch). Now requires explicit ids OR explicit all=true with a session user. The webhook-test endpoint at /api/v1/webhooks/test now requires requireAdmin: true on top of the webhooks:manage scope so a member-role user with a custom scope grant cannot trigger test deliveries that incur egress and downstream side effects.',
      },
      {
        text: 'Three identical audit-log routes consolidated; Breadcrumbs primitive applied',
        tag: 'improvement',
        detail:
          '/app/audit and /app/history now redirect to /app/audit-trail (the canonical implementation that pulls from the tamper-evident chain). Patient and care-plan detail pages now use notFound() instead of silently redirecting to the list — users get a real "Not found" boundary rather than a confusing bounce. The Breadcrumbs primitive added in v4-029 is now applied to the patient and care-plan detail routes. EmptyState components from the existing registry are wired into /app/team, /app/people, and /app/audit-trail with proper "no data yet" vs "filtered to none" distinction.',
      },
      {
        text: 'Orphan /app routes surfaced via parent sub-navigation',
        tag: 'improvement',
        detail:
          'Fifteen real /app/* pages (dashboard/builder, care-plans/journey, controls/journey, incidents/analytics, reports/trends and reports/custom, executive/group, policies/versions, registers/training, participants/import, and five settings sub-pages) existed as proper routes with 100-300 lines of code but appeared in zero industry sidebars — only reachable by typing the URL. lib/navigation/industry-sidebar.ts now has an ORPHAN_ROUTE_CHILDREN map that surfaces each as a sub-nav child of its natural parent across all eight industry navs from one place.',
      },
      {
        text: 'CI security scans actually block merges; weak status assertions tightened',
        tag: 'improvement',
        detail:
          'npm audit / Snyk / CodeQL in .github/workflows/qa-pipeline.yml were continue-on-error: true — high-severity CVEs in production deps could land. Now blocking, with --omit=dev so dev-dep churn does not block PRs. Four e2e spec files (audit-reports, security-invariants, billing-handoff, admin-security-verification) used to assert expect([200, 401, 403]).toContain(status), so an auth or privilege-escalation regression returning 401 to a workspace-seeded test silently passed. Replaced with exact-status expectations matching the actual contract (admin endpoints assert 403 against the non-admin seed; billing portal asserts the new 409 no_stripe_customer contract).',
      },
      {
        text: 'Misleading load tests rewritten against real endpoints; dead code removed',
        tag: 'fix',
        detail:
          'tests/load/k6-performance.js and artillery-config.yml were POSTing to /api/policies, /api/tasks, /api/team — none of which exist under that shape (mutating endpoints live under /api/v1/* with Bearer fos_… API keys). The suites passed visibly because the assertion accepted any non-5xx status. Both rewritten to hit real public endpoints (homepage, /pricing, /api/health) for genuine load coverage; authenticated load coverage stays in /load-tests where it has always lived. The standalone tests/accessibility/a11y-audit.js dropped its fake-JWT setupAuth and is now public-routes only (authenticated a11y coverage was already covered correctly by e2e/accessibility.spec.ts). Deleted: components/ProductShowcase.tsx (unused), e2e/industry-onboarding.spec.ts (six perma-skipped describes inflating spec counts), lighthouserc.js (footgun parallel to lighthouserc.json).',
      },
    ],
  },
  {
    version: 'v4.2.0',
    codename: 'Compliance Foundations',
    date: '2026-05-10',
    summary:
      'Per-control evaluator infrastructure for SOC 2 and ISO 27001 — typed registry, expanded framework packs to standard control counts, twelve working SOC 2 evaluators, real PDF report engine with brand typography, and a production-database bootstrap that finally landed eleven outstanding April migrations.',
    isMajor: true,
    changes: [
      {
        text: 'Per-control evaluator registry and contract shipped',
        tag: 'feature',
        detail:
          'lib/compliance/evaluators/index.ts plus the ControlEvaluator interface. Each evaluator is a pure function (orgId, db) => ControlResult with status (pass | fail | partial | not_evaluated), confidence derived from data completeness rather than hardcoded, evidenceRefs the auditor can verify, and gaps describing what is missing. Returns not_evaluated when primary data sources are absent instead of guessing — an honest pass is worth more than an unjustified one.',
      },
      {
        text: 'Framework packs expanded to standard control counts',
        tag: 'feature',
        detail:
          'framework-packs/soc2-tsc.json now lists all 64 SOC 2 Trust Services Criteria (was 11). framework-packs/iso27001-2022.json covers all 93 Annex A controls in the 2022 edition (was 10). Controls without an evaluator surface as "Not Assessed" in the dashboard rather than silently passing — auditors see the real denominator.',
      },
      {
        text: 'Twelve SOC 2 evaluators implemented across three batches',
        tag: 'feature',
        detail:
          'Batch A (access controls): CC6.1, CC6.2, CC6.3, CC6.6, CC6.7. Batch B (logging and monitoring): CC7.1, CC7.2, CC7.3, CC7.4. Batch C (change management + supporting): CC8.1, CC2.1, CC3.1. 64 evaluator unit tests cover pass / fail / partial / not_evaluated for each control. Two evaluators carry low-confidence string-heuristic fallbacks (CC6.3 audit metadata, CC7.4 actor attribution) — flagged in code comments and tracked in issue #45 alongside the four other schema gaps surfaced during this work.',
      },
      {
        text: 'Legacy control IDs migrated to standard references',
        tag: 'improvement',
        detail:
          'Eleven legacy SOC 2 IDs and ten legacy ISO IDs now map to standard control identifiers (e.g. SOC2-S2 → CC6.7). One ISO control (A.6.1 risk management) marked deprecated since it lives in ISO 27001 Clause 6 rather than Annex A 2022 and has no clean target. Idempotent TypeScript migration triggered from ensureFrameworkPacksInstalled, plus a SQL is_deprecated column on org_controls. 1:1 maps keep the original FK valid; 1:N splits leave evidence on the legacy row until users re-onboard the children.',
      },
      {
        text: 'Real PDF export engine for board pack, posture, and audit extracts',
        tag: 'feature',
        detail:
          '@react-pdf/renderer with three templates under lib/exports/pdf/templates/. Auth-gated route at app/api/exports/pdf/route.ts. Coexists with the existing jsPDF callers — no migration required, both work. lib/exports/formatters.ts no longer carries the "binary formats are deliberately not implemented" caveat that was blocking the board-pack PDF claim.',
      },
      {
        text: 'Inter and Sora fonts embedded in generated PDFs',
        tag: 'improvement',
        detail:
          'Brand typography now matches on-screen. Loaded once at module load via jsdelivr-hosted Google Fonts: Inter at 400 / 500 / 600 / 700 and Sora at 600 / 700 / 800. PDF size grows from roughly 4 KB to 17 KB with embedded font subsets — an acceptable trade for visual continuity between the app and the documents auditors see.',
      },
      {
        text: 'Eleven outstanding migrations bootstrapped into production',
        tag: 'security',
        detail:
          'The 20260402_* batch (auditor portal, care goals, NDIS line items, analytics snapshots, AI vector search, forms platform, investigations and CAPA, org groups, push tokens, search index, secure public views) had never been applied to the production Supabase project — tables existed only in the repo. Runtime degraded gracefully via lib/supabase/schema-compat.ts, which is why nobody noticed. After bootstrap: 179 public tables, 310 RLS policies across 148 tables, 590 indexes, pgvector and pg_trgm extensions enabled, and zero org_*/user_* tables without RLS.',
      },
      {
        text: 'Five typo classes repaired in source migrations',
        tag: 'fix',
        detail:
          'organization_members and org_memberships (both non-existent tables; canonical is org_members), SELECT org_id FROM org_members (wrong column; canonical is organization_id), org_visits(assigned_to, scheduled_date) (wrong columns; the actual ones are staff_id and scheduled_start per 20260208_care_operations_modules.sql), and REFERENCES profiles(id) (conditional table; safer reference is auth.users(id)). Nine migration files patched. Fresh-DB bootstraps will no longer fail on these — verified by replaying the bundle against a clean Postgres 17.6 instance.',
      },
    ],
  },
  {
    version: 'v4.1.0',
    codename: 'Mobile Surface',
    date: '2026-05-10',
    summary:
      'Track 1 of the two-track mobile plan: the existing /app routes polished for phone and tablet browsers. Eighteen routes audited at iPhone 14, iPhone SE, iPad portrait, and iPad Pro. Track 2 (a separate native app for frontline employees) is scoped in mobile/SCOPE_DECISION.md but intentionally not started.',
    isMajor: false,
    changes: [
      {
        text: 'PWA installable from iOS Add-to-Home-Screen',
        tag: 'feature',
        detail:
          'app/manifest.ts corrected with maskable icons, apple-touch-icon assets generated, and the apple-mobile-web-app-capable meta tag set. Add-to-Home-Screen now launches FormaOS standalone with the right splash and theme color rather than dropping into Safari chrome. Lighthouse PWA installability checks all pass.',
      },
      {
        text: '44 px touch-target compliance across the high-traffic routes',
        tag: 'improvement',
        detail:
          'Buttons, links, checkboxes, and radio inputs audited at iPhone 14 viewport across /app, /app/incidents, /app/care-plans, /app/participants, /app/staff-compliance, /app/forms, and /app/billing. Compliance asserted by e2e/mobile/touch-targets.spec.ts using getBoundingClientRect — every visible interactive control meets the WCAG 2.5.5 AAA size criterion on the audited surfaces.',
      },
      {
        text: 'Native keyboard ergonomics on every form',
        tag: 'improvement',
        detail:
          'Sign-in, sign-up, forgot-password, reset-password, the new-participant form, and the nine in-app search bars now declare inputMode, autoComplete, and enterKeyHint correctly. Numeric inputs request the digit keypad on iOS; phone fields request tel; emails request the email keyboard. Form input font-size lifted to 16 px on mobile to stop iOS auto-zoom on focus.',
      },
      {
        text: 'Eighteen admin routes audited at <=640 px',
        tag: 'improvement',
        detail:
          'Care ops: /app/incidents, /app/care-plans, /app/participants, /app/visits, /app/progress-notes. Compliance ops: /app/compliance, /app/policies, /app/staff-compliance, /app/registers, /app/audit-trail. Admin: /app/team, /app/billing, /app/settings and five settings sub-routes. Zero horizontal-scroll offenders at iPhone 14 (390 x 844) or iPhone SE (320 x 568). Visual baselines committed to e2e/screenshots/mobile/ for future regression review.',
      },
      {
        text: 'Tablet-aware executive dashboard widgets',
        tag: 'improvement',
        detail:
          '/app/executive 4-column widget grids collapse to 2 columns at 1024 px to stop the "CRITICA…" truncation that was happening on iPad portrait. No widget renders narrower than 280 px or wider than the viewport.',
      },
      {
        text: 'Pricing page definition-list accessibility fix',
        tag: 'fix',
        detail:
          'axe rule "definition-list" was failing on app/(marketing)/pricing/components/PricingHero.tsx. The dl element had a p sibling next to dt and dd inside the wrapper div, which axe correctly flags as a serious violation. Folded the sub-text into a nested span inside the dd so the markup validates without losing the visual treatment.',
      },
      {
        text: 'Capacitor webview shim removed',
        tag: 'improvement',
        detail:
          'The mobile/ directory contained a Capacitor project pointed at https://app.formaos.com.au — a webview-only app that App Store guideline 4.2 routinely rejects. mobile/SCOPE_DECISION.md records the two-track decision: Track 1 is responsive web in app/ (this release); Track 2 will be a narrowly-scoped native employee app, built fresh, when there is concrete customer demand.',
      },
    ],
  },
  {
    version: 'v4.0.0',
    codename: 'Foundation Audit',
    date: '2026-05-09',
    summary:
      'Wide-spectrum audit pass across authentication, authorisation, billing, observability, compliance honesty, and CI discipline. Closed seven blockers and thirteen high-severity findings identified during a from-scratch code-and-runtime review. Real row-level security replaces never-evaluated placeholder policies on fourteen multi-tenant tables; MFA is enforced at login rather than enrolled-then-ignored; trust packets are signed; CI gates actually block merges.',
    isMajor: true,
    changes: [
      {
        text: 'MFA challenge enforced at every login',
        tag: 'security',
        detail:
          'lib/security/mfa-enforcement.ts had zero call sites despite a complete enrollment flow shipping months earlier — verify2FAToken was never consulted on the password sign-in path. The login flow at components/auth/SignInPageContent.tsx and the OAuth callback at app/auth/callback/route.ts now redirect to /auth/mfa-challenge whenever the account has TOTP enabled. New per-session gate keyed on the Supabase access-token session_id claim, with rate-limited verification at /api/auth/mfa-verify and audit events on every success and failure.',
      },
      {
        text: 'Real row-level security on fourteen multi-tenant tables',
        tag: 'security',
        detail:
          'Fourteen RLS policies across org_care_goals, org_medications, org_medication_administrations, org_ndis_line_items, auditor_access_tokens, auditor_activity_log, search_index, search_history, saved_searches, recent_items, org_analytics_snapshots, org_saved_reports, org_report_generations, and org_goal_progress_entries depended on current_setting(\'app.current_org_id\') — a GUC that is never set anywhere in the runtime. The predicates always evaluated to NULL, which RLS treats as "deny", so service-role calls (which bypass RLS) saw everything and authenticated calls saw nothing — no real isolation existed. Replaced with the canonical org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()) pattern and 56 symmetrical select / insert / update / delete policies. Tenant isolation now has a real defense beyond the application-layer .eq filter.',
      },
      {
        text: 'Edge auth verifies the JWT, not just cookie presence',
        tag: 'security',
        detail:
          'proxy.ts:354-358 accepted any cookie matching sb-*-auth-token without verifying its contents — a forged cookie passed the gate and routes that did not themselves call getUser() became exposed. Replaced the cookie-name pattern with createServerClient + auth.getUser() at the edge, with bearer-token requests skipping the session check (route handlers validate the bearer themselves via authenticateV1Request or authenticateScimRequest).',
      },
      {
        text: 'CSRF protection default-on at middleware',
        tag: 'security',
        detail:
          'validateCsrfOrigin was opt-in and roughly thirty mutating routes did not call it, including /api/auth/bootstrap, /api/auth/signup, /api/comments, /api/organizations/switch, and /api/queue/process. Added enforcement in proxy.ts for every state-changing /api/* request, with an explicit allowlist for routes that authenticate by something other than session cookies (Stripe webhook, webhook deliveries, cron secret, internal trigger callbacks, RFC 8058 unsubscribe, SAML ACS, SCIM bearer).',
      },
      {
        text: 'SAML hardened with strict InResponseTo and the missing SLO route',
        tag: 'security',
        detail:
          'validateInResponseTo upgraded from ifPresent to always — the previous setting accepted IdP responses without an InResponseTo attribute, opening a downgrade vector for SP-initiated flows. Replay-protection cache now requires Redis in production and throws at boot if UPSTASH_REDIS_REST_URL is missing — the in-process Map fallback was useless across serverless instances. Added the missing /api/sso/saml/logout/[orgId] SLO callback that the metadata had been advertising with no handler.',
      },
      {
        text: 'API keys auto-revoke when their creator loses admin rights',
        tag: 'security',
        detail:
          'Two Postgres triggers on org_members revoke api_keys.created_by rows when a user is demoted from admin or owner role, or removed from the organisation entirely. Plus a runtime defense-in-depth check in lib/api-keys/manager.ts that closes the race between role change and trigger commit and catches direct-DB role changes.',
      },
      {
        text: 'Trust packets cryptographically signed and verifiable',
        tag: 'security',
        detail:
          'Each generated trust packet is HMAC-SHA256 signed via TRUST_PACKET_SIGNING_KEY at issue time. New POST /api/trust-packet/verify endpoint lets recipients confirm integrity with a constant-time comparison. The previously-hardcoded encryption_at_rest: true and encryption_in_transit: true claims now flow through lib/trust/runtime-claims.ts, derived from runtime config and the org\'s actual SSO record (not "is plan enterprise"). Long-term JWS + JWKS upgrade documented in code comments for partner-driven offline verification.',
      },
      {
        text: 'No free trial; payment required before app access',
        tag: 'improvement',
        detail:
          'TRIAL_ELIGIBLE_PLANS is empty by design; the layout-level redirect at app/app/layout.tsx:131-147 already routed pending_checkout users to /app/billing immediately on every /app/* request. Reduced the database-level grace from 14 days to 1 day so the marketing copy and the runtime agree, and replaced the misleading "Start free configuration" CTA on the pricing page. The pricing FAQ now states the no-trial position unambiguously.',
      },
      {
        text: 'AUD and GST handled by Stripe Tax in checkout',
        tag: 'feature',
        detail:
          'Checkout sessions now pass automatic_tax: { enabled: true } and tax_id_collection: { enabled: true }, with customer_update.address: \'auto\' for existing customers. Stripe Tax must be enabled in the Stripe dashboard for this to take effect (configured for Australia ahead of merge). GST line items now appear on every invoice for AU customers.',
      },
      {
        text: 'Hard-coded production Stripe price IDs removed from source',
        tag: 'security',
        detail:
          'lib/billing/plans.ts:24-26 carried three live Stripe price IDs as fallbacks — secret hygiene smell. Removed; production builds now fail closed via scripts/check-env.js when STRIPE_PRICE_FOUNDATION / GROWTH / SCALE are missing. The orphan lib/billing.ts (500 LoC, only imported by tests, with parallel implementations of createCheckoutSession and updateSubscriptionTier that did not ship) was deleted alongside its tests.',
      },
      {
        text: 'Regulatory dashboards labelled experimental until real evaluators land',
        tag: 'improvement',
        detail:
          'NQF, NSQHS, star-rating-readiness, and AML transaction-monitoring endpoints all matched org_tasks.title against keyword regexes for "compliance progress" — pattern matching against task names is not a regulatory assessment. Each response now carries experimental: true plus a notice field clarifying that the percentages are not certification evidence. Hidden from the default dashboard nav until per-area evaluators exist.',
      },
      {
        text: 'AI assistant: fake confidence scores stripped',
        tag: 'improvement',
        detail:
          'Twelve hardcoded confidence: 0.85 | 0.7 | … literals across lib/ai-assistant.ts removed. Confidence is now null and a grounded: false marker tells UI consumers the assistant is general compliance Q&A, not a RAG-grounded helper. The retrieval infrastructure (lib/ai/vector-store.ts, lib/ai/embeddings.ts) exists but is not wired in — that is a future workstream when AI usage is meaningful.',
      },
      {
        text: 'Trigger.dev placeholder removed; observability provider mounted',
        tag: 'improvement',
        detail:
          'trigger.config.ts defaulted project to \'proj_local_placeholder\'; none of the 18 task files at trigger/ were dispatched from anywhere — Vercel crons ran their workloads inline. Removed the SDK and the directory entirely. New <ObservabilityProvider /> at app/layout.tsx finally calls posthog.init() at the React root (which had never happened before — analytics was silently dark in production). New GET /api/health/observability returns presence-booleans for Sentry / PostHog / OpenTelemetry / Langfuse so deploy gates fail loudly when keys are unset.',
      },
      {
        text: 'CI gates actually block merges',
        tag: 'improvement',
        detail:
          'extended_quality_validation no longer runs continue-on-error: true — full E2E and performance checks are blocking again. ESLint ceiling tightened from --max-warnings 350 to 25, with a new lint-warning-ratchet.yml weekly cron that auto-PRs the ceiling lower as actuals improve. scripts/check-env.js is now strict in CI by default with CHECK_ENV_SKIP_IN_CI=1 as the explicit opt-out for runners without secrets. The "Extended Quality Validation" job no longer hides regressions behind a soft-fail.',
      },
      {
        text: 'compliance-check cron paginated and bounded against the 30s timeout',
        tag: 'fix',
        detail:
          'The daily org-iteration cron previously ran 5+ sequential queries per org with BATCH_SIZE=100 — easily 30 s+ at scale, hitting the Vercel function timeout. Now BATCH_SIZE=25, parallel via Promise.all across orgs in a batch, and a SOFT_DEADLINE_MS=50000 guard returns 200 { partial: true, orgsChecked } rather than being killed mid-write at the platform timeout.',
      },
    ],
  },
  {
    version: 'v3.8.0',
    codename: 'Evidence Integrity',
    date: '2026-04-25',
    summary:
      'Evidence and audit integration pass: obligation uploads now write to Supabase storage, evidence rows link back to obligations and typed entities, the obligations register reads real evidence counts, and audit-trail activity is available through a new entity-filtered API.',
    isMajor: true,
    changes: [
      {
        text: 'Obligation evidence uploads now persist to storage',
        tag: 'feature',
        detail:
          'The /api/v1/evidence/upload route writes files to the private evidence bucket, inserts org_evidence rows, rolls back storage on failed inserts, and emits audit events. Why it matters: evidence collection now produces real files and database records instead of a cosmetic upload path.',
      },
      {
        text: 'Evidence counts in obligations are now truthful',
        tag: 'improvement',
        detail:
          '/api/v1/compliance/obligations now counts org_evidence rows by obligation instead of returning hard-coded zeroes. The EvidenceDrawer refreshes the parent register after upload so the visible count tracks the underlying record.',
      },
      {
        text: 'Entity evidence supports incidents and future source links',
        tag: 'integration',
        detail:
          'org_evidence gained nullable task_id support plus entity_type and entity_id indexing, allowing evidence to attach to incidents and other operational records without pretending every file belongs to a task.',
      },
      {
        text: 'Audit trail API backs evidence activity panels',
        tag: 'feature',
        detail:
          'New GET /api/v1/audit-trail filters org_audit_logs by entity and powers activity views in evidence drawers and shared audit panels. For auditors: evidence now has clearer source and activity context.',
      },
      {
        text: 'Storage bucket and RLS policies added for evidence',
        tag: 'security',
        detail:
          'The 20260425_evidence_workflow_integrity migration provisions the private evidence bucket and org-scoped storage policies based on the first path segment matching the member organization.',
      },
      {
        text: 'Deep evidence workflow coverage added',
        tag: 'improvement',
        detail:
          'e2e/deep-workflow-integrity.spec.ts verifies obligation evidence upload through UI, database row, storage download, parent count refresh, and invalid-input rejection.',
      },
    ],
  },
  {
    version: 'v3.7.4',
    codename: 'Guided Start',
    date: '2026-04-25',
    summary:
      'First-session onboarding now guides users through real setup work across care plans, goals, progress notes, evidence, and tasks, with persistent progress and contextual guidance inside the app.',
    isMajor: false,
    changes: [
      {
        text: 'Start Here card for the first five actions',
        tag: 'feature',
        detail:
          'The dashboard now shows a Start Here card driven by lib/onboarding/first-session.ts. It checks real workspace counts and points users to care plan creation, goal setup, progress notes, vault evidence, and task review.',
      },
      {
        text: 'Global onboarding strip and contextual banners',
        tag: 'feature',
        detail:
          'OnboardingStrip keeps the next step visible across the authenticated shell, while OnboardingBanner appears inside relevant module pages such as care plans and vault.',
      },
      {
        text: 'Cross-session completion feedback',
        tag: 'improvement',
        detail:
          'org_first_session_progress stores seen completion steps so success feedback does not repeat after reloads or later sessions. Why it matters: onboarding now feels stateful rather than like a resettable checklist.',
      },
      {
        text: 'Sidebar guidance and completion CTA',
        tag: 'improvement',
        detail:
          'The sidebar and post-onboarding surfaces nudge users back to the active setup step, then move them toward incident and compliance work once the initial setup path is complete.',
      },
      {
        text: 'Onboarding flow coverage expanded',
        tag: 'improvement',
        detail:
          'e2e/onboarding-flow.spec.ts covers the Start Here card, active guidance, completion feedback, and persistence behavior.',
      },
    ],
  },
  {
    version: 'v3.7.3',
    codename: 'Careflow',
    date: '2026-04-24',
    summary:
      'Care Plans moved from static records into a working module with goals, supports, progress calculation, participant context, status transitions, journey boards, and RLS hardening.',
    isMajor: false,
    changes: [
      {
        text: 'Care plan goals and supports',
        tag: 'feature',
        detail:
          'Care-plan detail pages now support JSONB-backed goals and supports via app/app/actions/care-operations.ts and lib/care-plans/normalize.ts, including goal and support status updates.',
      },
      {
        text: 'Progress calculation and persistence',
        tag: 'feature',
        detail:
          'Plan progress is computed from goal progress and verified through reload checks. For teams: care-plan progress now reflects the underlying goal state rather than static page copy.',
      },
      {
        text: 'Participant, progress note, and visit context',
        tag: 'integration',
        detail:
          'Care plan detail surfaces link back to participant records and show related progress notes and visit context when available, making the plan easier to review in the participant timeline.',
      },
      {
        text: 'Care-plan journey board',
        tag: 'feature',
        detail:
          '/app/care-plans/journey and CarePlansJourneyBoard provide a pipeline-style view for status movement, matching the broader journey-board pattern introduced for controls.',
      },
      {
        text: 'Care plans RLS update fix',
        tag: 'security',
        detail:
          'The 20260617_fix_care_plans_rls_update migration recreates care_plans_org_isolation with explicit USING and WITH CHECK clauses so org-scoped updates remain allowed and isolated.',
      },
    ],
  },
  {
    version: 'v3.7.2',
    codename: 'Operating Motion',
    date: '2026-04-24',
    summary:
      'Buying paths, dashboard signals, and workflow handoffs were cleaned up so the public site and authenticated app better match FormaOS as compliance infrastructure.',
    isMajor: false,
    changes: [
      {
        text: 'Foundation, Growth, and Enterprise buying motion clarified',
        tag: 'enterprise',
        detail:
          'Public pricing now presents Foundation self-serve, Growth compliance-plan intake, and Enterprise demo/procurement routing. Foundation preserves plan and checkout intent through signup; Enterprise no longer implies direct public checkout.',
      },
      {
        text: 'Free-trial funnel language removed from active buying paths',
        tag: 'improvement',
        detail:
          'Public buying-motion tests guard against Start Free Trial and 14-day trial copy on core marketing routes. Why it matters: the page now sells infrastructure scope instead of a disposable trial funnel.',
      },
      {
        text: 'Stripe readiness documented for the new commercial paths',
        tag: 'integration',
        detail:
          'docs/billing-migration-plan.md documents Foundation checkout, Growth Payment Link readiness for post-demo sales motion, Enterprise invoicing, and rollback guidance.',
      },
      {
        text: 'Dashboard shifted toward truthful operator data',
        tag: 'improvement',
        detail:
          'The command-center dashboard, next-actions strip, KPI bar, timeline primitives, and dashboard truthfulness tests make the app surface more action-first and less demo-like.',
      },
    ],
  },
  {
    version: 'v3.7.1',
    codename: 'Reconcile II',
    date: '2026-04-22',
    summary:
      'Audit re-pass: added CSRF origin validation to three admin mutation routes that relied on SameSite cookies alone, brought in-app plan comparison copy back in line with marketing, and cleared all remaining eslint warnings.',
    isMajor: false,
    changes: [
      {
        text: 'Admin CSRF defence-in-depth',
        tag: 'security',
        detail:
          'POST /api/admin/audit/run, /api/admin/orgs/[orgId]/notes, and /api/admin/users/[userId]/resend-confirmation now validate the request Origin/Referer header before any auth or DB call. All 23 admin mutation handlers are now CSRF-validated.',
      },
      {
        text: 'In-app plan comparison parity',
        tag: 'improvement',
        detail:
          'PLAN_CATALOG Foundation tier now lists Audit log export and Framework evaluation reports so the in-app billing UI reads identically to the /pricing page.',
      },
      {
        text: 'Lint cleanup',
        tag: 'improvement',
        detail:
          'Removed dead type imports and a stale const binding surfaced by eslint. Lint is now warning-free.',
      },
    ],
  },
  {
    version: 'v3.7.0',
    codename: 'Reconcile',
    date: '2026-04-22',
    summary:
      'End-to-end audit sprint: fixed in-app upgrade prices to match marketing and Stripe, hardened the billing checkout API with schema validation and role gates, repaired a dashboard CTA link, and tightened trust claims on marketing.',
    isMajor: false,
    changes: [
      {
        text: 'In-app upgrade pricing matches marketing and Stripe',
        tag: 'fix',
        detail:
          'PlanComparisonTable and UpgradeIntelligenceModal now read prices from the canonical plan catalog ($297 Foundation / $797 Growth / $1,800 Scale / Custom Enterprise) instead of hardcoded placeholder values. Enterprise CTA routes to sales contact instead of a broken checkout.',
      },
      {
        text: 'Billing checkout API hardened',
        tag: 'fix',
        detail:
          'POST /api/billing/checkout now validates the payload with a zod schema (UUID orgId, allowlisted planId) and explicitly gates on owner or admin role before initiating Stripe checkout.',
      },
      {
        text: 'Billing plan lookup corrected',
        tag: 'fix',
        detail:
          'GET /api/billing now maps plan_key "basic" to legacy plan_code "starter" before reading SUBSCRIPTION_PLANS, so paid Foundation customers no longer see the free plan in their billing response.',
      },
      {
        text: 'Admin plan route syncs entitlements on every tier change',
        tag: 'fix',
        detail:
          'Removed the basic|pro gate around syncEntitlementsForPlan on the admin org-plan route. Enterprise upgrades now provision entitlements the same way Foundation and Growth do.',
      },
      {
        text: 'Dashboard quick action link fix',
        tag: 'fix',
        detail:
          'The "Invite a teammate" tile now routes to /app/team instead of the non-existent /app/settings/team.',
      },
      {
        text: 'Pricing page parity with product capability',
        tag: 'improvement',
        detail:
          'Added Audit log export and Framework evaluation reports bullets to the Foundation tier on /pricing — both already ship at that tier per the entitlement map.',
      },
      {
        text: 'Trust page framework claims tightened',
        tag: 'improvement',
        detail:
          'NDIS Practice Standards and NSQHS now show as industry pack roadmap on /trust rather than as shipped framework packs.',
      },
    ],
  },
  {
    version: 'v3.6.0',
    codename: 'Horizon',
    date: '2026-04-14',
    summary:
      'Enterprise marketing overhaul: 100x homepage upgrade with social proof and visual refresh, enterprise marketing pages Phase 1 & 2, Stripe webhook billing fix, Tailwind class audit with legacy btn migration, and reduced layout bloat across all marketing pages.',
    isMajor: true,
    changes: [
      {
        text: '100x homepage upgrade — social proof, section consolidation, and visual refresh',
        tag: 'feature',
        detail:
          'Complete homepage redesign with bento grid security command center, visual-first industry accordions with stat cards, premium footer with CTA section, and consolidated trust signals. Every section upgraded to enterprise-grade visual fidelity.',
      },
      {
        text: 'Enterprise marketing upgrade Phase 1 & 2',
        tag: 'feature',
        detail:
          'Full overhaul of marketing page hierarchy: new ImmersiveHero component, upgraded product and solution pages, refined typography system, and consistent glassmorphism visual language across all marketing surfaces.',
      },
      {
        text: 'Stripe webhook unblocked and invoice handlers hardened',
        tag: 'fix',
        detail:
          'Fixed critical billing issue where Stripe webhooks were failing silently. Hardened all invoice event handlers with proper error boundaries, idempotency checks, and retry-safe processing.',
      },
      {
        text: 'Tailwind class audit and legacy btn-to-mk-btn migration',
        tag: 'improvement',
        detail:
          'Audited all Tailwind classes for invalid utilities, removed deprecated class references, and migrated legacy btn-* classes to the new mk-btn design system for consistency.',
      },
      {
        text: 'Eliminated VisualDivider spacing bloat across all marketing pages',
        tag: 'fix',
        detail:
          'Removed excessive padding and minHeight values from VisualDivider and DeferredSection wrappers that were creating unnecessary whitespace between marketing sections.',
      },
    ],
  },
  {
    version: 'v3.5.0',
    codename: 'Prism',
    date: '2026-04-11',
    summary:
      'Product maturity and growth sprint: full billing, emails, onboarding, and monitoring infrastructure, comprehensive SEO engine with IndexNow and structured data, LCP performance fix from 4.2s to sub-2s, enterprise theme upgrade across all 5 themes, blog internal linking, and updated marketing mockups.',
    isMajor: true,
    changes: [
      {
        text: 'Full product maturity sprint — billing, emails, onboarding, security, monitoring',
        tag: 'feature',
        detail:
          'Comprehensive infrastructure buildout: Stripe billing integration with subscription management, transactional email system, guided onboarding flow, security headers and CSP policies, error monitoring with Sentry, and admin plan-change governance.',
      },
      {
        text: 'Comprehensive SEO engine — metadata, structured data, IndexNow, OG images',
        tag: 'feature',
        detail:
          'Full SEO overhaul across all marketing pages: dynamic metadata generation, JSON-LD structured data for organization and products, IndexNow integration for Bing instant indexing, auto-generated OG images, and robots.txt optimization.',
      },
      {
        text: 'LCP performance fix from 4.2s to sub-2s',
        tag: 'improvement',
        detail:
          'Eliminated largest contentful paint bottleneck by skipping initial page transition animation, server-rendering hero image, and adding preload hints for above-fold assets. Core Web Vitals now passing.',
      },
      {
        text: 'Enterprise-level upgrade to all 5 app themes',
        tag: 'feature',
        detail:
          'Complete visual refresh of all 5 themes (Default, Midnight, Arctic, Forest, Sunset) with refined color palettes, improved contrast ratios, consistent spacing tokens, and enterprise-appropriate visual density.',
      },
      {
        text: 'Blog internal linking across 12 posts with RelatedPosts component',
        tag: 'feature',
        detail:
          'Added contextual internal links to 12 blog posts connecting related content. New RelatedPosts component automatically surfaces relevant articles based on shared tags and topic proximity.',
      },
      {
        text: 'Marketing mockups updated to match current FormaOS design system',
        tag: 'improvement',
        detail:
          'Refreshed all product screenshots and marketing mockups to reflect the current app UI including count-up animations, RAG status indicators, stagger effects, and sidebar navigation updates.',
      },
      {
        text: 'Industry landing pages upgraded with new shared components',
        tag: 'feature',
        detail:
          'Rebuilt 5 industry landing pages (Healthcare, NDIS, Aged Care, Childcare, Financial Services) with shared IndustryHero, FrameworkGrid, and ComplianceJourney components for visual consistency.',
      },
    ],
  },
  {
    version: 'v3.4.0',
    codename: 'Sentinel',
    date: '2026-04-09',
    summary:
      'Quality and performance sprint: TypeScript any cleanup across 65+ files, admin command center decomposition from 1,908 to 303 lines, 47 WCAG 2.1 AA accessibility fixes, mobile responsiveness for 6 pages, statement coverage from 53% to 55% with 200+ new tests, and performance validation with clean production build.',
    isMajor: true,
    changes: [
      {
        text: 'TypeScript any cleanup across 65+ files with zero tsc errors',
        tag: 'improvement',
        detail:
          'Systematic removal of all remaining untyped any annotations. Replaced with proper types, generics, unknown with type narrowing, and Supabase-aware casts. 4 justified @ts-expect-error suppressions documented. Full codebase now compiles with zero TypeScript errors.',
      },
      {
        text: 'Admin command center decomposed from 1,908 to 303 lines',
        tag: 'improvement',
        detail:
          'Split monolithic admin-command-center.tsx into 7 focused modules: shared types, constants, formatting utilities, category panel components, result renderers, and a clean orchestrator. 84% reduction in main file size with improved maintainability.',
      },
      {
        text: '47 WCAG 2.1 AA accessibility fixes across 22 files',
        tag: 'improvement',
        detail:
          'Comprehensive accessibility pass: aria-label on all icon-only buttons, form validation errors linked via aria-describedby, skip navigation links, correct heading hierarchy (no skipped levels), focus management for modals and dialogs, color contrast compliance, and screen reader live-region announcements.',
      },
      {
        text: 'Mobile responsiveness fixed for 6 core app pages',
        tag: 'fix',
        detail:
          'Resolved overflow, touch target, and layout issues on tasks, visits, incidents, forms, vault review, and people pages. Added responsive breakpoints, mobile-first grid layouts, and proper viewport handling for all interactive elements.',
      },
      {
        text: 'Statement coverage increased from 53% to 55% - 4,363 tests passing',
        tag: 'improvement',
        detail:
          'Added 28 new test files with 200+ tests covering automation templates, API helpers, CORS, PII scanner, retention engine, policy engine, settings engine, release service, public uptime, trigger client, bootstrap, and more. Coverage: 55.08% statements, 51.54% branches, 58.34% functions.',
      },
      {
        text: 'Production build validated with IndustryHero type fix',
        tag: 'fix',
        detail:
          'Fixed pre-existing framer-motion ease type error in IndustryHero.tsx that blocked production builds. Confirmed all 27 admin routes have loading.tsx Suspense boundaries. Clean npm run build generating 238 static pages.',
      },
    ],
  },
  {
    version: 'v3.3.0',
    codename: 'Catalyst',
    date: '2026-04-08',
    summary:
      'Master sprint: guided onboarding wizard, demo seed data for 6 industries, financial services compliance dashboard, branch coverage from 34% to 50%, TypeScript any cleanup across 50 files, and employer dashboard decomposition from 1,840 to 528 lines.',
    isMajor: true,
    changes: [
      {
        text: 'Multi-step onboarding wizard with industry-specific framework roadmaps',
        tag: 'feature',
        detail:
          'Guided onboarding flow that detects organization industry and presents tailored compliance framework recommendations, progress milestones, and contextual next-step actions to accelerate time-to-value.',
      },
      {
        text: 'Demo seed data for all 6 supported industries',
        tag: 'feature',
        detail:
          'Pre-built realistic seed data for NDIS, Healthcare, Aged Care, Childcare, Community Services, and Financial Services. Includes demo banner indicator and one-click clear function for safe exploration.',
      },
      {
        text: 'Financial Services compliance dashboard with breach register and board reporting',
        tag: 'feature',
        detail:
          'Purpose-built dashboard for APRA/ASIC/AML-CTF compliance: breach register with severity tracking, board report generator, transaction monitoring overview, risk scoring engine, and regulatory obligation timeline.',
      },
      {
        text: 'Branch coverage increased from 34% to 50% - 4,102 tests passing',
        tag: 'improvement',
        detail:
          'Added comprehensive test suites bringing branch coverage from 34.72% to 50.10% (9,075 of 18,115 branches). 301 test suites, 4,102 tests, 0 failures. Covers compliance engine, auth, API routes, stores, and utilities.',
      },
      {
        text: 'TypeScript any types removed from 50 files with proper typing',
        tag: 'improvement',
        detail:
          'Systematic cleanup replacing untyped any annotations with Record<string, unknown>, proper generics, Supabase-aware casts, and unknown with type narrowing. Zero tsc errors after all changes.',
      },
      {
        text: 'Employer dashboard decomposed from 1,840 to 528 lines',
        tag: 'improvement',
        detail:
          'Split monolithic employer-dashboard.tsx into 5 focused files: quick-actions (592 lines), industry-labels (62 lines), attention-rail (272 lines), employer-tables (410 lines), and main orchestrator (528 lines). 72% reduction in main file size.',
      },
    ],
  },
  {
    version: 'v3.1.1',
    codename: 'Bastion',
    date: '2026-04-05',
    summary:
      'Enterprise audit remediation: resolved all 5 blocking issues - XSS sanitization, global API rate limiting, error handling across 36 route files, dependency vulnerabilities patched to zero, and full test suite passing at 896 tests.',
    isMajor: false,
    changes: [
      {
        text: 'HTML sanitization library deployed across all XSS-risk surfaces',
        tag: 'security',
        detail:
          'Installed sanitize-html and created lib/security/sanitize-html.ts with three context-aware sanitizers: sanitizeHtml (general), sanitizeSnippet (search results - allows only mark, b, em, strong, span), and sanitizeMarkdown (AI chat - allows structural markdown tags plus img). Patched search page, global search, and AI assistant message rendering.',
      },
      {
        text: 'Global API rate limiter in edge middleware - 120 req/min per IP',
        tag: 'security',
        detail:
          'Added an edge-compatible in-memory sliding window rate limiter to proxy.ts that covers all /api/* routes at the middleware level. Returns 429 with Retry-After header when exceeded. Includes periodic cleanup to prevent memory leaks. Individual routes retain stricter Redis-backed limits.',
      },
      {
        text: 'try/catch error handling added to 56 API handler functions',
        tag: 'fix',
        detail:
          'Wrapped 56 exported handler functions across 36 API route files (18 V1, 8 SCIM, 10 other) with structured try/catch blocks. V1 routes log [V1 API] errors, SCIM routes return RFC 7644-compliant error schemas, and all routes return proper 500 JSON responses instead of leaking stack traces.',
      },
      {
        text: 'All npm dependency vulnerabilities resolved - zero remaining',
        tag: 'security',
        detail:
          'Applied npm audit fix to patch both high-severity vulnerabilities: lodash prototype pollution and @xmldom/xmldom XML injection via CDATA serialization. Production dependency scan now returns zero vulnerabilities.',
      },
      {
        text: 'Rate limiting added to governance, identity, activity, and SSO routes',
        tag: 'security',
        detail:
          'Applied per-route rateLimitApi() checks to 11 previously unprotected routes: governance/classification, residency, retention, isolation, identity/audit, activity, sso/test, sso/metadata, and sso/directory-sync.',
      },
      {
        text: 'Full test suite green: 896 tests passing, 0 failures',
        tag: 'fix',
        detail:
          'Fixed the stale industry-sidebar test that expected 5 healthcare navigation categories but the source code now returns 7 (added Registers and Reports). Created 17 new sanitize-html unit tests validating all three sanitizer configurations. Final: 93 suites, 896 passed, 0 failures.',
      },
      {
        text: 'Enterprise audit report generated with 10-phase analysis',
        tag: 'enterprise',
        detail:
          'Comprehensive enterprise audit covering static analysis, build, database/schema integrity, security, performance, test coverage, API integrity, accessibility, dependencies, and configuration. Findings reviewed and tracked internally; remediation rolled into subsequent release notes.',
      },
    ],
  },
  {
    version: 'v3.1.0',
    codename: 'Citadel',
    date: '2026-04-03',
    summary:
      'Enterprise governance expansion: framework cross-mapping, task management, usage analytics, permissions matrix, policy lifecycle, document retention, org branding, dashboard builder, integration marketplace, and enhanced audit trail.',
    isMajor: true,
    changes: [
      {
        text: 'Framework cross-mapping with confidence scoring',
        tag: 'feature',
        detail:
          'Map controls across frameworks with confidence scores (exact, strong, partial, weak). 31 pre-loaded cross-mappings between ISO 27001, SOC 2, HIPAA, and NIST CSF. Interactive mapping explorer with bi-directional relationship visualization.',
      },
      {
        text: 'Full task management system with Kanban board',
        tag: 'feature',
        detail:
          'Complete task management with priorities, dependencies, assignees, due dates, and Kanban board view. Tasks link to controls and evidence for full compliance traceability. Subtask support and bulk operations included.',
      },
      {
        text: 'Usage analytics and telemetry dashboard',
        tag: 'feature',
        detail:
          'Track platform adoption with login frequency, feature usage heatmaps, compliance activity timelines, and engagement scores per user. Admin-only dashboard with exportable reports.',
      },
      {
        text: 'Granular permissions matrix with team management',
        tag: 'security',
        detail:
          'Fine-grained permission system with 8 resource types, 4 access levels, and team-scoped inheritance. Visual permissions matrix editor for admins. Respects org hierarchy with cascading team permissions.',
      },
      {
        text: 'Policy lifecycle management',
        tag: 'feature',
        detail:
          'End-to-end policy lifecycle: draft, review, approval, publish, and retirement. Version history with diff comparison, stakeholder review workflows, acknowledgment tracking, and scheduled review reminders.',
      },
      {
        text: 'Document retention policies with automated archival',
        tag: 'enterprise',
        detail:
          'Configure retention rules per document category with regulatory presets (ASIC 7-year, NDIS 7-year, HIPAA 6-year, GDPR-aligned). Automated archival and legal hold support with full audit trail.',
      },
      {
        text: 'Organization settings hub with custom branding',
        tag: 'feature',
        detail:
          'Centralized org settings: branding (logo, colors, favicon), security policies, notification defaults, locale/timezone, and white-label configuration. Branding previews before publish.',
      },
      {
        text: 'Custom dashboard builder with drag-and-drop',
        tag: 'feature',
        detail:
          'Build personalized compliance dashboards with 15 widget types including compliance scores, task boards, evidence timelines, framework coverage, and risk heatmaps. Drag-and-drop layout with save/share capability.',
      },
      {
        text: 'Integration marketplace with 20+ connectors',
        tag: 'integration',
        detail:
          'Categorized integration marketplace with connectors for productivity (Slack, Teams, Jira), cloud (AWS, Azure, GCP), identity (Okta, Azure AD), security (Qualys, Tenable), and HRIS (BambooHR, Workday). One-click install with configuration wizard.',
      },
      {
        text: 'Enhanced audit trail with advanced filtering and export',
        tag: 'security',
        detail:
          'Rebuilt audit trail with 20+ event types, advanced filtering (actor, action, resource, date range, IP address), real-time streaming, and bulk export in CSV/JSON formats. User agent tracking and session correlation.',
      },
    ],
  },
  {
    version: 'v3.0.0',
    codename: 'Nexus',
    date: '2026-04-01',
    summary:
      'Platform infrastructure overhaul: third-party integrations, threaded comments, report generator, webhook relay, evidence versioning, risk analytics, AI insights, email system, compliance scanner, dashboard widgets, API v1, and scheduled tasks.',
    isMajor: true,
    changes: [
      {
        text: 'Third-party integration engine with 12 pre-built connectors',
        tag: 'integration',
        detail:
          'Configurable integration framework supporting Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS CloudTrail, Azure Monitor, Okta, Google Workspace, Qualys, Tenable, and ServiceNow. OAuth2 and API key auth with automatic token refresh and health monitoring.',
      },
      {
        text: 'Threaded comments on all compliance entities',
        tag: 'feature',
        detail:
          'Rich-text threaded comments on controls, evidence, tasks, incidents, and policies. @mention notifications, file attachments, inline code blocks, and reaction support. All comments are part of the immutable audit record.',
      },
      {
        text: 'Compliance report generator with 6 template types',
        tag: 'feature',
        detail:
          'Generate executive summaries, framework-specific reports, evidence completeness reports, risk assessment reports, audit readiness packets, and custom reports. Scheduled delivery with PDF and CSV export. Branded report headers.',
      },
      {
        text: 'Webhook relay with HMAC-SHA256 signed payloads',
        tag: 'feature',
        detail:
          'Outbound webhook system supporting 15+ event types with HMAC-SHA256 payload signing, configurable retry policies, delivery logging, and a built-in webhook testing console. Inbound webhooks for integration data collection.',
      },
      {
        text: 'Evidence file versioning with complete history',
        tag: 'improvement',
        detail:
          'Full version control for evidence artifacts with SHA-256 verification at every version. Visual diff between versions, restore previous versions, and complete version metadata (uploader, timestamp, reason for change).',
      },
      {
        text: 'Risk scoring engine and analytics dashboard',
        tag: 'feature',
        detail:
          'Multi-dimensional risk scoring across controls, frameworks, and organizational units. Interactive risk heatmap with drill-down, trend analysis, risk category breakdowns (compliance, operational, security), and exportable risk reports.',
      },
      {
        text: 'AI-powered compliance insights and recommendations',
        tag: 'feature',
        detail:
          'AI engine that analyzes compliance posture and generates actionable recommendations. Priority-ranked suggestions for evidence gaps, control improvements, upcoming risks, and efficiency optimizations. Contextual insights surfaced across dashboard and control views.',
      },
      {
        text: 'Transactional email system with Resend',
        tag: 'feature',
        detail:
          'Purpose-built email system for compliance notifications, task assignments, evidence review requests, credential expiry alerts, and digest summaries. React Email templates with branded formatting and delivery tracking.',
      },
      {
        text: 'Automated compliance scanning with scheduling',
        tag: 'feature',
        detail:
          'Scheduled compliance scans that evaluate control status, evidence freshness, credential expiry, policy review dates, and framework coverage. Configurable scan frequency (hourly, daily, weekly) with alert thresholds and drift detection.',
      },
      {
        text: 'Dashboard widgets with configurable positioning',
        tag: 'feature',
        detail:
          'Widget-based dashboard system with 15 widget types: compliance scores, task summaries, evidence timelines, risk heatmaps, framework gauges, recent activity, and more. Drag-and-drop positioning with size configuration.',
      },
      {
        text: 'REST API v1 with bearer authentication and rate limiting',
        tag: 'feature',
        detail:
          'Full v1 REST API with 20+ endpoints covering organizations, tasks, evidence, compliance data, reports, frameworks, controls, notifications, integrations, and search. Bearer API keys with scoped permissions, cursor pagination, and per-key rate limiting.',
      },
      {
        text: 'Scheduled task execution with Trigger.dev',
        tag: 'feature',
        detail:
          'Background task infrastructure for evidence freshness monitoring, compliance score recalculation, credential expiry checks, report generation, and integration sync jobs. Configurable schedules with execution logging and retry policies.',
      },
    ],
  },
  {
    version: 'v2.2.4',
    codename: 'Meridian',
    date: '2026-03-28',
    summary:
      'Full platform audit at extreme level, marketing homepage expansion from 6 to 11 visible sections, flagship page copy hardening, and comprehensive test suite fixes.',
    isMajor: false,
    changes: [
      {
        text: 'Homepage expanded from 6 to 11 visible sections for stronger buyer conversion',
        tag: 'feature',
        detail:
          'Enabled five high-conversion homepage sections - industries, security, outcome proof, procurement flow, and trust - that were previously disabled. The homepage now presents a complete buyer narrative from problem through proof to CTA.',
      },
      {
        text: 'Hero copy sharpened to lead with outcomes instead of product category',
        tag: 'improvement',
        detail:
          'Rewrote the homepage hero from "Run Compliance as an Operating System" to "Compliance That Runs Itself / So Your Team Can Run the Business" with a subheadline emphasizing immutable evidence chains and named owners.',
      },
      {
        text: 'Enterprise page hardened against overclaims for procurement safety',
        tag: 'enterprise',
        detail:
          'Fixed four enterprise page issues: removed implied certification language, replaced "Contractual SLA guarantees with financial remediation" with accurate "Enterprise service commitments" language, updated trust badge copy, and sharpened the enterprise evaluation CTA.',
      },
      {
        text: 'AuditBoard comparison page deepened with concrete differentiators',
        tag: 'improvement',
        detail:
          'Added multi-framework deduplication and healthcare/NDIS coverage as comparison points, tightened positioning copy to emphasize execution-first operating system vs. audit management tooling.',
      },
      {
        text: 'All npm dependency vulnerabilities resolved - zero remaining',
        tag: 'security',
        detail:
          'Ran npm audit fix to patch four vulnerabilities including a critical handlebars JS injection, a high-severity picomatch method injection, and two moderate issues in yaml and brace-expansion. Production dependency scan now returns zero vulnerabilities.',
      },
      {
        text: 'Security test suite fixed with proper Next.js Web API mocking',
        tag: 'fix',
        detail:
          'Added jest.mock for next/server before imports in the security test suite to resolve "Request is not defined" error in the Node test environment. All 45 security tests now pass.',
      },
      {
        text: 'Multi-org invitation test suite repaired with admin API mocks',
        tag: 'fix',
        detail:
          'Added missing mocks for findAuthUserByEmail and getAdminProfileDirectoryEntries which switched from the profiles table to the Supabase admin API. Both known-user and unknown-user invitation flows now pass.',
      },
      {
        text: 'Homepage experience test aligned with current section visibility defaults',
        tag: 'fix',
        detail:
          'Updated the homepage section decision test to expect 11 visible sections (4 critical + 7 non-critical) matching the new default configuration after the marketing expansion.',
      },
      {
        text: 'A/B test CLI runner fixed by switching from ts-node to tsx',
        tag: 'fix',
        detail:
          'Replaced the missing ts-node dependency with tsx (already available) in the ab-test npm script. All 5 A/B test configurations now validate successfully.',
      },
      {
        text: 'Marketing upgrade agent prompt authored for future marketing passes',
        tag: 'improvement',
        detail:
          'Created a comprehensive 4-phase marketing upgrade agent prompt covering all 62 marketing pages with exact design system references, audit findings, execution plan, content rules, and validation checklist.',
      },
    ],
  },
  {
    version: 'v2.2.3',
    codename: 'Horizon',
    date: '2026-03-22',
    summary:
      'QA stability hardening for signup, smoke checks, release verification, and dashboard pages still touching fragile auth-admin paths.',
    isMajor: false,
    changes: [
      {
        text: 'Email signup now fails fast and degrades cleanly during auth outages',
        tag: 'security',
        detail:
          'Hardened the email signup API with tighter external timeouts, clearer backend-unavailable handling, and safer rate limiting so users no longer sit on long hangs when Supabase Auth write endpoints are degraded.',
      },
      {
        text: 'Signup UI now steers users toward a safe fallback path',
        tag: 'improvement',
        detail:
          'Updated the signup experience to surface a clear email-password outage message and guide users toward Google sign-in or a later retry instead of leaving them with an ambiguous timeout failure.',
      },
      {
        text: 'Smoke and founder QA flows now preflight auth write availability',
        tag: 'fix',
        detail:
          'Added explicit Supabase Auth bootstrap checks in the Playwright helpers so smoke and founder validation skip with a real reason when upstream auth write APIs are unavailable instead of failing with HTML parsing noise or hanging sessions.',
      },
      {
        text: 'Staff compliance page no longer depends on auth-admin profile lookups',
        tag: 'fix',
        detail:
          'Removed a fragile auth-admin user lookup from the staff compliance dashboard and replaced it with database-backed profile reads from user_profiles, eliminating one of the route timeouts surfaced by the QA sweep.',
      },
      {
        text: 'QA pipeline audit coverage tightened for security and visual checks',
        tag: 'improvement',
        detail:
          'Shipped the Lighthouse workflow env/artifact fix, stabilized the built-app marketing screenshot suite, and added route-level regression coverage for degraded signup behavior so release signals stay trustworthy.',
      },
      {
        text: 'Dependency audit blocker cleared in the release gate',
        tag: 'fix',
        detail:
          'Upgraded the vulnerable flatted dependency and refreshed the lockfile so the GitHub dependency security scan returns zero moderate-or-higher production vulnerabilities.',
      },
    ],
  },
  {
    version: 'v2.2.2',
    codename: 'Sentinel',
    date: '2026-03-21',
    summary:
      'Production hardening for onboarding, invitations, report exports, and live validation across roles, industries, and dashboard states.',
    isMajor: false,
    changes: [
      {
        text: 'Live production verification for onboarding, dashboard access, and invitations',
        tag: 'improvement',
        detail:
          'Ran targeted live checks across owner, member, and viewer flows on the production domain. Verified owner navigation through tasks, policies, vault, team, reports, billing, and executive views, plus confirmed invitation persistence and delivery.',
      },
      {
        text: 'Industry and role matrix coverage expanded across the platform',
        tag: 'feature',
        detail:
          'Extended browser validation to cover all supported industries, plan tiers, framework-library states, dashboard shells, marketing CTA routes, and real sign-in handoff behavior so regressions are caught across the full persona matrix.',
      },
      {
        text: 'Auth bootstrap and invitation APIs now survive Redis degradation',
        tag: 'security',
        detail:
          'Moved post-login bootstrap and authenticated invitation flows onto resilient API rate limiting so production users are not locked out when the Upstash Redis backend is degraded. Enforcement remains active with safe in-memory fallback.',
      },
      {
        text: 'Report export endpoints hardened for degraded infrastructure',
        tag: 'fix',
        detail:
          'Export generation now avoids fail-closed behavior during Redis outages for authenticated admin flows, and report export links no longer prefetch in the background. This removes a class of noisy 429s while preserving export quotas.',
      },
      {
        text: 'Schema-drift fallbacks added for audit, activity, and AI support tables',
        tag: 'fix',
        detail:
          'Optional or partially migrated tables such as AI conversation history, activity feed, and older org audit log shapes now degrade cleanly instead of surfacing runtime failures during onboarding, dashboard, and admin workflows.',
      },
      {
        text: 'Founder email and audit test surfaces polished',
        tag: 'improvement',
        detail:
          'Refined the founder-only test email template into a more polished branded format, confirmed live delivery through Resend, and tightened quality gates around app links, admin navigation, and dashboard regression checks.',
      },
    ],
  },
  {
    version: 'v2.2.1',
    codename: 'Keystone',
    date: '2026-03-20',
    summary:
      'Enterprise audit remediation focused on auth correctness, schema migration cleanup, test coverage, and non-mutating quality gates.',
    isMajor: false,
    changes: [
      {
        text: 'Production signup and auth callback flows hardened',
        tag: 'security',
        detail:
          'Converted signup into a real production bootstrap route, added app-level OAuth state validation, and enforced JSON content types on sensitive auth endpoints to reduce redirect, CSRF, and malformed-request risk.',
      },
      {
        text: 'Critical-path unit coverage expanded for audit-sensitive modules',
        tag: 'improvement',
        detail:
          'Added focused tests for trial access verification, auth callback logic, activity feed behavior, invitation creation, system state calculation, framework provisioning, onboarding branching, dashboard rendering, and sidebar selection.',
      },
      {
        text: 'Legacy profile access moved toward schema-safe reads',
        tag: 'fix',
        detail:
          'Replaced direct reads against the removed profiles table with shared user-profile lookup helpers and compatibility paths, reducing drift-related failures during admin, reporting, and dashboard flows.',
      },
      {
        text: 'Lint, style, and design governance checks restored as safe quality gates',
        tag: 'improvement',
        detail:
          'Updated linting to run without mutating files during verification and restored missing stylelint and design-check coverage so release gates better reflect actual repo quality without altering the worktree.',
      },
      {
        text: 'Compliance harnesses and build verification unblocked',
        tag: 'fix',
        detail:
          'Repaired GDPR and SOC 2 automation harness failures tied to originless browser storage, then reran build, accessibility, smoke, and Lighthouse checks under real environment configuration to turn previously blocked audit phases into actionable signals.',
      },
    ],
  },
  {
    version: 'v2.2.0',
    codename: 'Vanguard',
    date: '2026-03-16',
    summary:
      'AI-powered compliance assistant, SOC 2 self-certification engine, and automated evidence collection.',
    isMajor: true,
    changes: [
      {
        text: 'AI Compliance Assistant with streaming chat',
        tag: 'feature',
        detail:
          'In-app AI assistant powered by GPT-4o that understands your compliance posture. Ask questions about controls, draft auditor-ready policies, get evidence guidance, run gap analysis, and receive step-by-step implementation instructions - all contextualised to your organization.',
      },
      {
        text: 'SOC 2 Self-Certification readiness engine',
        tag: 'enterprise',
        detail:
          'Automated readiness assessment across all 5 SOC 2 Trust Service domains with weighted scoring. Calculates your certification readiness in real-time based on evidence, tasks, and control evaluations.',
      },
      {
        text: 'Automated evidence collection with 11 system checks',
        tag: 'feature',
        detail:
          'Continuous automated verification of compliance artifacts against SOC 2 controls. Checks for security policies, MFA evidence, monitoring configs, backup procedures, encryption policies, privacy notices, and more.',
      },
      {
        text: 'Gap analyzer with prioritised remediation actions',
        tag: 'feature',
        detail:
          'Intelligent gap analysis that identifies missing or partial controls and generates prioritised remediation actions. Risk-based priority mapping ensures critical gaps are addressed first.',
      },
      {
        text: 'Certification milestone tracker with auto-evaluation',
        tag: 'feature',
        detail:
          '8-milestone certification journey from framework enablement to report generation. Milestones auto-complete as your system state progresses, giving clear visibility into certification readiness.',
      },
      {
        text: 'SOC 2 certification report generator',
        tag: 'enterprise',
        detail:
          'One-click generation of comprehensive SOC 2 certification reports including domain scores, control results, automated checks, milestones, remediation status, and historical score trends.',
      },
      {
        text: '5 AI prompt templates for compliance workflows',
        tag: 'feature',
        detail:
          'Pre-built prompt templates for common compliance tasks: Compliance Q&A, Policy Drafting, Evidence Guidance, Gap Analysis, and Implementation Guidance. Each template enriches AI context with your organization data.',
      },
      {
        text: 'Conversation history with persistent AI chat sessions',
        tag: 'improvement',
        detail:
          'Full conversation management with searchable history, session persistence, and the ability to resume previous AI assistant conversations with complete context.',
      },
      {
        text: 'New RBAC permissions for AI features',
        tag: 'security',
        detail:
          'Fine-grained access control with USE_AI_ASSISTANT and DRAFT_AI_POLICIES permissions. All roles get AI access; policy drafting restricted to Owner and Compliance Officer.',
      },
      {
        text: 'AI and SOC 2 entitlements gated by plan tier',
        tag: 'enterprise',
        detail:
          'AI Assistant and SOC 2 Self-Certification available on Pro and Enterprise plans. Entitlement system ensures feature access matches subscription level.',
      },
    ],
  },
  {
    version: 'v2.1.0',
    codename: 'Aurora',
    date: '2026-03-08',
    summary:
      'Command palette 2.0, real-time collaboration, and 3 new integrations.',
    isMajor: false,
    changes: [
      {
        text: 'Command palette with fuzzy search across all entities',
        tag: 'feature',
        detail:
          'Search controls, evidence, tasks, incidents, and settings from a single keyboard shortcut. Results ranked by relevance with inline preview.',
      },
      {
        text: 'Real-time collaboration with live presence indicators',
        tag: 'feature',
        detail:
          'See who is editing what in real-time. Conflict resolution handles simultaneous edits gracefully with visual merge indicators.',
      },
      {
        text: 'Jira Cloud integration for compliance task sync',
        tag: 'integration',
        detail:
          'Bi-directional sync between FormaOS tasks and Jira issues. Status changes propagate automatically with field mapping configuration.',
      },
      {
        text: 'ServiceNow CMDB connector for asset inventory',
        tag: 'integration',
        detail:
          'Pull CMDB configuration items into FormaOS for automated asset-to-control mapping and compliance scope management.',
      },
      {
        text: 'PagerDuty integration for incident escalation',
        tag: 'integration',
        detail:
          'Trigger PagerDuty incidents from FormaOS compliance alerts. Escalation policies and on-call schedules honored automatically.',
      },
      {
        text: 'Improved notification batching to reduce alert fatigue',
        tag: 'improvement',
        detail:
          'Smart grouping algorithm batches related notifications by entity and timeframe. Configurable quiet hours and priority overrides.',
      },
      {
        text: 'Fixed rare race condition in concurrent evidence uploads',
        tag: 'fix',
        detail:
          'Resolved edge case where simultaneous uploads to the same control could result in version history inconsistency.',
      },
      {
        text: 'Session management improvements for SSO users',
        tag: 'security',
        detail:
          'Added configurable session timeout enforcement for SAML-authenticated sessions with forced re-authentication support.',
      },
    ],
  },
  {
    version: 'v2.0.0',
    codename: 'Sovereign',
    date: '2026-02-15',
    summary:
      'Major release: SCIM 2.0, compliance gates, risk heatmap, and workflow automation.',
    isMajor: true,
    changes: [
      {
        text: 'SCIM 2.0 automated user lifecycle provisioning',
        tag: 'enterprise',
        detail:
          'Full SCIM 2.0 support for Okta, Azure AD, and OneLogin. Automated user creation, role assignment, team membership, and deprovisioning synced from your identity provider.',
      },
      {
        text: 'Compliance Gate enforcement engine',
        tag: 'feature',
        detail:
          'Configurable enforcement points that structurally block progress when compliance prerequisites are unmet. Gates integrate with approval workflows, CI/CD pipelines, and audit preparation processes.',
      },
      {
        text: 'Visual risk heatmap with drill-down capability',
        tag: 'feature',
        detail:
          'Interactive heatmap showing risk concentrations across frameworks, categories, and individual controls. Color-coded by overdue status, evidence freshness, and ownership gaps.',
      },
      {
        text: 'Workflow automation with 12+ trigger types',
        tag: 'feature',
        detail:
          'Visual workflow builder supporting event-driven automation with conditional branching, multi-step escalation chains, and scheduled execution.',
      },
      {
        text: 'Cross-framework evidence mapping and overlap detection',
        tag: 'feature',
        detail:
          'Evidence collected for one framework automatically satisfies overlapping requirements in other active frameworks. Reduces duplicate evidence collection by up to 60%.',
      },
      {
        text: 'Board-ready compliance report generator',
        tag: 'enterprise',
        detail:
          'One-click generation of executive compliance reports with posture scores, trend analysis, risk highlights, and framework-specific summaries formatted for board presentation.',
      },
      {
        text: 'HIPAA framework pack with 72 pre-mapped controls',
        tag: 'feature',
        detail:
          'Complete HIPAA coverage including Administrative, Physical, and Technical safeguards with evidence templates and audit checklist.',
      },
      {
        text: 'Enhanced row-level security with per-organization isolation',
        tag: 'security',
        detail:
          'Database-level tenant isolation using PostgreSQL Row-Level Security policies. Every query is scoped by organization with no bypass path.',
      },
      {
        text: 'Bulk operations across controls, evidence, and tasks',
        tag: 'improvement',
        detail:
          'Multi-select and batch update capabilities for mass assignment, status changes, and archival operations with full audit trail preservation.',
      },
      {
        text: 'Historical compliance score trending with regression detection',
        tag: 'improvement',
        detail:
          'Track compliance posture over time with configurable trend windows. Automated alerts when scores drop below historical baselines.',
      },
    ],
  },
  {
    version: 'v1.9.0',
    codename: 'Meridian',
    date: '2026-01-20',
    summary:
      'PCI-DSS framework, incident management, and evidence version control.',
    isMajor: false,
    changes: [
      {
        text: 'PCI-DSS v4.0 framework pack with 78 controls',
        tag: 'feature',
        detail:
          'Complete PCI-DSS v4.0 coverage with self-assessment questionnaire mapping, compensating controls support, and ROC evidence templates.',
      },
      {
        text: 'Full incident lifecycle management',
        tag: 'feature',
        detail:
          'Report, investigate, assign corrective actions, and close incidents with evidence. Severity-based auto-escalation with configurable SLA timers.',
      },
      {
        text: 'Evidence version control with diff comparison',
        tag: 'feature',
        detail:
          'Full version history for every evidence artifact with visual diff between revisions. See exactly what changed and who made the change.',
      },
      {
        text: 'Azure AD SSO support via SAML 2.0',
        tag: 'enterprise',
        detail:
          'Native Azure Active Directory integration with group-based role mapping and conditional access policy support.',
      },
      {
        text: 'Framework-specific export templates',
        tag: 'improvement',
        detail:
          'Export audit packets in framework-required formats. ISO 27001 SOA, SOC 2 Type II evidence bundles, GDPR DPIA templates.',
      },
      {
        text: 'Fixed evidence checksum verification on large file uploads',
        tag: 'fix',
        detail:
          'Resolved issue where SHA-256 verification could timeout on files larger than 500MB. Switched to streaming hash computation.',
      },
      {
        text: 'Improved API rate limiting for enterprise endpoints',
        tag: 'security',
        detail:
          'Graduated rate limiting with burst allowance for enterprise API consumers. Per-organization quotas with configurable limits.',
      },
    ],
  },
  {
    version: 'v1.8.0',
    codename: 'Bastion',
    date: '2025-12-10',
    summary:
      'NIST CSF framework, automation templates, and data residency controls.',
    isMajor: false,
    changes: [
      {
        text: 'NIST Cybersecurity Framework pack with 108 controls',
        tag: 'feature',
        detail:
          'Complete NIST CSF coverage across Identify, Protect, Detect, Respond, and Recover functions with implementation tier mapping.',
      },
      {
        text: 'Pre-built automation workflow templates',
        tag: 'feature',
        detail:
          'Library of automation templates for common compliance workflows: evidence collection reminders, control review cadences, and expiry alerts.',
      },
      {
        text: 'Data residency preference configuration',
        tag: 'enterprise',
        detail:
          'Configure preferred data residency region. AU-default with infrastructure ready for US and EU deployments as regulatory requirements expand.',
      },
      {
        text: 'Enhanced role-based access control with custom roles',
        tag: 'security',
        detail:
          'Define custom roles with granular per-framework, per-entity permissions. Role templates for common compliance team structures.',
      },
      {
        text: 'Contextual help system with guided onboarding',
        tag: 'improvement',
        detail:
          'Location-aware help widget surfaces relevant documentation and walkthroughs. New user onboarding flow covers platform setup, framework activation, and team invitation.',
      },
      {
        text: 'Fixed timezone handling in compliance score calculations',
        tag: 'fix',
        detail:
          'Resolved edge case where daily compliance checks could run at inconsistent times for organizations spanning multiple time zones.',
      },
    ],
  },
  {
    version: 'v1.7.0',
    codename: 'Vector',
    date: '2025-11-05',
    summary:
      'CIS Controls framework, Slack integration, and compliance scoring engine.',
    isMajor: false,
    changes: [
      {
        text: 'CIS Controls v8 framework pack with 153 controls',
        tag: 'feature',
        detail:
          'Complete CIS Controls v8 coverage with Implementation Group (IG1/IG2/IG3) filtering and prioritization based on organizational maturity.',
      },
      {
        text: 'Slack integration for compliance notifications',
        tag: 'integration',
        detail:
          'Deliver compliance alerts, task assignments, and review requests to Slack channels. Configurable per-channel routing with thread support.',
      },
      {
        text: 'Continuous compliance scoring engine',
        tag: 'feature',
        detail:
          'Real-time posture scoring with daily automated checks. Scores broken down by framework, category, and individual control with threshold-based alerting.',
      },
      {
        text: 'Microsoft Teams connector',
        tag: 'integration',
        detail:
          'Send compliance notifications and alerts to Teams channels. Adaptive card format with inline action buttons for quick response.',
      },
      {
        text: 'Evidence expiry tracking with automated reminders',
        tag: 'improvement',
        detail:
          'Configure expiration dates on evidence artifacts. Automated reminder chains fire at 30, 14, 7, and 1 day before expiry.',
      },
      {
        text: 'Improved search indexing for faster global search',
        tag: 'improvement',
        detail:
          'Rebuilt search index with trigram matching for sub-200ms results across all entity types. Saved search support with pinned queries.',
      },
      {
        text: 'Fixed pagination in audit trail export',
        tag: 'fix',
        detail:
          'Resolved issue where audit trail exports exceeding 10,000 records could produce incomplete CSV files. Switched to streaming export.',
      },
    ],
  },
  {
    version: 'v1.6.0',
    codename: 'Prism',
    date: '2025-10-01',
    summary:
      'GDPR framework, notification center, and task management overhaul.',
    isMajor: false,
    changes: [
      {
        text: 'GDPR framework pack with Article-mapped controls',
        tag: 'feature',
        detail:
          'Complete GDPR coverage with Article-level control mapping, DPIA templates, data processing activity records, and consent management evidence templates.',
      },
      {
        text: 'Centralized notification center with multi-channel delivery',
        tag: 'feature',
        detail:
          'Unified notification hub aggregating alerts across the compliance program. In-app, email, Slack, and Teams delivery with smart batching.',
      },
      {
        text: 'Task management overhaul with priority and due dates',
        tag: 'improvement',
        detail:
          'Redesigned task system with priority levels, due date tracking, assignee management, and Kanban board view for compliance workflows.',
      },
      {
        text: 'Google Workspace SSO integration',
        tag: 'enterprise',
        detail:
          'SAML 2.0 single sign-on with Google Workspace. Automatic role mapping based on Google Groups membership.',
      },
      {
        text: 'Evidence bulk upload with drag-and-drop',
        tag: 'improvement',
        detail:
          'Upload multiple evidence files simultaneously with drag-and-drop. Auto-detection of file types and suggested control mapping.',
      },
      {
        text: 'Fixed control assignment notifications not firing for bulk operations',
        tag: 'fix',
        detail:
          'Resolved issue where bulk control assignment did not trigger individual notification delivery to newly assigned owners.',
      },
    ],
  },
  {
    version: 'v1.5.0',
    codename: 'Aegis',
    date: '2025-08-20',
    summary:
      'SOC 2 framework, evidence vault with SHA-256, and immutable audit trail.',
    isMajor: true,
    changes: [
      {
        text: 'SOC 2 Trust Services Criteria framework pack',
        tag: 'feature',
        detail:
          'Complete SOC 2 coverage across Security, Availability, Processing Integrity, Confidentiality, and Privacy criteria with 64 pre-mapped controls.',
      },
      {
        text: 'Evidence Vault with SHA-256 cryptographic verification',
        tag: 'feature',
        detail:
          'Immutable evidence storage with SHA-256 hash at upload, verification at every access, full version history, and chain-of-custody tracking.',
      },
      {
        text: 'Immutable audit trail with cryptographic linking',
        tag: 'security',
        detail:
          'Append-only audit trail with cryptographically linked records. Every action logged with actor, event, entity, timestamp, and justification.',
      },
      {
        text: 'Okta SAML 2.0 SSO integration',
        tag: 'enterprise',
        detail:
          'Enterprise single sign-on via Okta with JIT (Just-In-Time) user provisioning and attribute-based role assignment.',
      },
      {
        text: 'Compliance posture dashboard with framework breakdown',
        tag: 'feature',
        detail:
          'Executive dashboard showing aggregate compliance posture with per-framework breakdown, recent activity feed, and overdue item highlights.',
      },
      {
        text: 'One-click audit packet export',
        tag: 'improvement',
        detail:
          'Export framework-mapped evidence bundles with verification metadata, control mapping index, and evidence completeness report.',
      },
      {
        text: 'Fixed role permission inheritance in nested team structures',
        tag: 'fix',
        detail:
          'Resolved issue where permissions defined at parent team level were not correctly inherited by members of nested sub-teams.',
      },
    ],
  },
  {
    version: 'v1.4.0',
    codename: 'Cipher',
    date: '2025-07-10',
    summary:
      'Inline comments, global search, and care plan management for NDIS providers.',
    isMajor: false,
    changes: [
      {
        text: 'Inline comments with threaded discussions and @mentions',
        tag: 'feature',
        detail:
          'Comment directly on controls, evidence, tasks, and incidents. Threaded conversations with @mention notifications and rich text support.',
      },
      {
        text: 'Global search across all entity types',
        tag: 'feature',
        detail:
          'Full-text search across controls, evidence, tasks, incidents, and audit logs with faceted filtering and context snippet highlighting.',
      },
      {
        text: 'NDIS care plan and participant management',
        tag: 'feature',
        detail:
          'Purpose-built for NDIS providers: participant care plans, goal-linked progress notes, visit scheduling with compliance-verified check-in/check-out.',
      },
      {
        text: 'Care delivery service logs for audit compliance',
        tag: 'feature',
        detail:
          'Service delivery logging that satisfies NDIS Quality & Safeguards Commission audit requirements with billing reconciliation support.',
      },
      {
        text: 'Enhanced control assignment workflow',
        tag: 'improvement',
        detail:
          'Streamlined control ownership assignment with team-based allocation, workload visibility, and suggested assignments based on expertise.',
      },
      {
        text: 'Fixed evidence download resumption on interrupted connections',
        tag: 'fix',
        detail:
          'Implemented range-request support for evidence downloads enabling resume on network interruption for large files.',
      },
    ],
  },
  {
    version: 'v1.3.0',
    codename: 'Sentinel',
    date: '2025-06-01',
    summary:
      'Automation engine, webhook integrations, and framework cross-mapping.',
    isMajor: false,
    changes: [
      {
        text: 'Event-driven automation engine with visual workflow builder',
        tag: 'feature',
        detail:
          'Build automation rules with drag-and-drop. 8 initial trigger types including control status change, evidence expiry, and score threshold.',
      },
      {
        text: 'Webhook integration framework for external systems',
        tag: 'integration',
        detail:
          'Inbound and outbound webhook support for connecting FormaOS with external tools. Configurable payload templates and retry policies.',
      },
      {
        text: 'Cross-framework control mapping visualization',
        tag: 'feature',
        detail:
          'Interactive visualization showing control overlap between active frameworks. Identify shared evidence requirements to reduce compliance workload.',
      },
      {
        text: 'Evidence tagging and categorization system',
        tag: 'improvement',
        detail:
          'Tag evidence artifacts with custom labels for organization. Category-based filtering in evidence vault for faster discovery.',
      },
      {
        text: 'Fixed CSV import handling for non-UTF8 encoded files',
        tag: 'fix',
        detail:
          'Added automatic character encoding detection for CSV imports. Supports UTF-8, UTF-16, ISO-8859-1, and Windows-1252 encodings.',
      },
    ],
  },
  {
    version: 'v1.2.0',
    codename: 'Keystone',
    date: '2025-04-15',
    summary: 'Team management, role-based access, and compliance dashboard v1.',
    isMajor: false,
    changes: [
      {
        text: 'Team management with organizational hierarchy',
        tag: 'feature',
        detail:
          'Create teams, sub-teams, and organizational units. Assign team-level permissions and compliance responsibilities.',
      },
      {
        text: 'Role-based access control with 5 predefined roles',
        tag: 'security',
        detail:
          'Admin, Compliance Manager, Auditor (read-only), Team Lead, and Member roles with granular permission matrices.',
      },
      {
        text: 'Compliance posture dashboard v1',
        tag: 'feature',
        detail:
          'Initial compliance dashboard showing framework activation status, control completion percentages, and recent activity feed.',
      },
      {
        text: 'Email notification preferences',
        tag: 'improvement',
        detail:
          'Configure per-notification-type email preferences. Digest mode batches non-urgent notifications into daily or weekly summaries.',
      },
      {
        text: 'Fixed control status transitions allowing invalid state changes',
        tag: 'fix',
        detail:
          'Enforced valid state machine transitions for control lifecycle. Prevented direct jump from Draft to Completed without Review.',
      },
    ],
  },
  {
    version: 'v1.1.0',
    codename: 'Foundation',
    date: '2025-03-01',
    summary:
      'Evidence upload system, control library, and basic task management.',
    isMajor: false,
    changes: [
      {
        text: 'Evidence upload with file type validation',
        tag: 'feature',
        detail:
          'Upload compliance evidence with supported file type validation. PDF, DOCX, XLSX, CSV, PNG, JPG, and MP4 support with 100MB size limit.',
      },
      {
        text: 'Control library with custom control creation',
        tag: 'feature',
        detail:
          'Create custom controls with description, category, evidence requirements, and review cadence configuration.',
      },
      {
        text: 'Basic task management with status tracking',
        tag: 'feature',
        detail:
          'Create tasks linked to controls and evidence. Track status across To Do, In Progress, Review, and Done stages.',
      },
      {
        text: 'User invitation and onboarding flow',
        tag: 'improvement',
        detail:
          'Email-based user invitation with guided onboarding. New users receive platform overview, role explanation, and first-task guidance.',
      },
      {
        text: 'Fixed authentication token refresh race condition',
        tag: 'fix',
        detail:
          'Resolved issue where concurrent requests during token refresh could result in temporary authentication failures.',
      },
    ],
  },
  {
    version: 'v1.0.0',
    codename: 'Genesis',
    date: '2025-01-15',
    summary:
      'Initial launch with ISO 27001 framework pack and core compliance platform.',
    isMajor: true,
    changes: [
      {
        text: 'ISO 27001:2022 framework pack with 114 Annex A controls',
        tag: 'feature',
        detail:
          'Complete ISO 27001:2022 coverage including all 93 Annex A controls organized by the 4 control themes: Organizational, People, Physical, and Technological.',
      },
      {
        text: 'Multi-tenant platform architecture',
        tag: 'feature',
        detail:
          'Secure multi-tenant architecture with organization-level data isolation, workspace management, and the foundation for enterprise features.',
      },
      {
        text: 'User authentication with email/password and magic links',
        tag: 'security',
        detail:
          'Secure authentication system supporting email/password and passwordless magic link login with rate limiting and brute-force protection.',
      },
      {
        text: 'Organization and workspace creation',
        tag: 'feature',
        detail:
          'Create organizations with workspace isolation. Invite team members, configure workspace settings, and activate compliance frameworks.',
      },
      {
        text: 'Control management with status lifecycle',
        tag: 'feature',
        detail:
          'Full control lifecycle management: Draft, Active, Under Review, Compliant, Non-Compliant, and Archived states with transition validation.',
      },
      {
        text: 'Basic evidence attachment to controls',
        tag: 'feature',
        detail:
          'Attach evidence files to controls as proof of compliance implementation. Initial support for PDF and document formats.',
      },
    ],
  },
];

/* ─── Computed Stats ──────────────────────────────────────── */

const totalChanges = releases.reduce((sum, r) => sum + r.changes.length, 0);
const totalFeatures = releases.reduce(
  (sum, r) => sum + r.changes.filter((c) => c.tag === 'feature').length,
  0,
);
const totalFixes = releases.reduce(
  (sum, r) => sum + r.changes.filter((c) => c.tag === 'fix').length,
  0,
);
const majorReleases = releases.filter((r) => r.isMajor).length;

const monthsActive = (() => {
  const start = new Date(releases[releases.length - 1].date);
  const end = new Date(releases[0].date);
  return Math.max(
    1,
    Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    ) + 1,
  );
})();

const changelogStats = [
  { value: String(releases.length), label: 'Releases Shipped', suffix: '' },
  { value: String(totalChanges), label: 'Total Changes', suffix: '+' },
  { value: String(totalFeatures), label: 'Features Added', suffix: '' },
  { value: String(majorReleases), label: 'Major Releases', suffix: '' },
  { value: String(totalFixes), label: 'Bugs Fixed', suffix: '' },
  { value: String(monthsActive), label: 'Months Active', suffix: '' },
];

/* ─── Animated Stat ───────────────────────────────────────── */

function AnimatedStat({
  value,
  label,
  suffix,
  delay,
}: {
  value: string;
  label: string;
  suffix: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }}
      className="text-center px-2"
    >
      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1">
        {value}
        <span className="text-emerald-400">{suffix}</span>
      </div>
      <div className="text-xs sm:text-sm text-slate-400 font-medium">
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Tag Badge ───────────────────────────────────────────── */

function TagBadge({ tag }: { tag: ChangeTag }) {
  const config = TAG_CONFIG[tag];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.text}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

/* ─── Change Item ─────────────────────────────────────────── */

function ChangeItem({
  change,
  index,
}: {
  change: ChangelogChange;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = TAG_CONFIG[change.tag];
  const itemClassName = `rounded-xl border border-white/[0.06] bg-white/[0.02] p-4
          transition-all duration-300
          hover:bg-white/[0.04] hover:border-white/[0.1]
          hover:shadow-[0_0_30px_rgba(${config.colorRgb},0.04)]`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: EASE_OUT_EXPO }}
      className="group"
    >
      {change.detail ? (
        <button
          type="button"
          className={`${itemClassName} w-full cursor-pointer text-left`}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `rgba(${config.colorRgb}, 0.8)` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm text-white font-medium leading-snug">
                  {change.text}
                </span>
                <TagBadge tag={change.tag} />
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 mt-0.5"
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </motion.div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className="overflow-hidden"
              >
                <div className="pt-3 pl-4 border-t border-white/[0.04] mt-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {change.detail}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      ) : (
        <div className={itemClassName}>
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `rgba(${config.colorRgb}, 0.8)` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm text-white font-medium leading-snug">
                  {change.text}
                </span>
                <TagBadge tag={change.tag} />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Release Card ────────────────────────────────────────── */

function ReleaseCard({
  release,
  index,
  isLatest,
}: {
  release: ChangelogRelease;
  index: number;
  isLatest: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleChanges = showAll
    ? release.changes
    : release.changes.slice(0, 5);
  const hasMore = release.changes.length > 5;

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    release.changes.forEach((c) => {
      counts[c.tag] = (counts[c.tag] || 0) + 1;
    });
    return counts;
  }, [release.changes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: EASE_OUT_EXPO }}
      className="relative"
    >
      {/* Timeline connector dot */}
      <div
        className={`absolute -left-[2.3rem] sm:-left-[2.8rem] top-8 w-4 h-4 rounded-full border-2 z-10
          ${
            release.isMajor
              ? 'border-emerald-400/60 bg-emerald-500/20 shadow-[0_0_14px_rgba(52,211,153,0.3)]'
              : 'border-white/20 bg-white/5'
          }`}
      />

      <div
        className={`group rounded-2xl border bg-white/[0.02] overflow-hidden transition-all duration-400
          ${
            release.isMajor
              ? 'border-emerald-400/15 hover:border-emerald-400/25 hover:shadow-[0_0_50px_rgba(52,211,153,0.06)]'
              : 'border-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_40px_rgba(255,255,255,0.02)]'
          }`}
      >
        {/* Major release glow */}
        {release.isMajor && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 0% 0%, rgba(52,211,153,0.08), transparent 50%)',
            }}
          />
        )}

        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-white/[0.04]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center
                  ${
                    release.isMajor
                      ? 'border-emerald-400/20 bg-emerald-500/10'
                      : 'border-white/[0.08] bg-white/[0.04]'
                  }`}
              >
                {release.isMajor ? (
                  <Rocket
                    className={`w-5 h-5 ${release.isMajor ? 'text-emerald-400' : 'text-slate-400'}`}
                  />
                ) : (
                  <Package className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {release.version}
                  </h3>
                  <span className="text-sm text-slate-500 font-medium">
                    {release.codename}
                  </span>
                  {isLatest && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      Latest
                    </span>
                  )}
                  {release.isMajor && !isLatest && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-violet-400/20 bg-violet-500/10 text-violet-400">
                      <Star className="w-2.5 h-2.5" />
                      Major
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {release.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={release.date}>
                {new Date(release.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>

          {/* Tag summary strip */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(tagCounts).map(([tag, count]) => {
              const tc = TAG_CONFIG[tag as ChangeTag];
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${tc.bg} ${tc.border} ${tc.text}`}
                >
                  {tc.label}: {count}
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 border border-white/[0.06] bg-white/[0.02]">
              {release.changes.length} changes total
            </span>
          </div>
        </div>

        {/* Changes list */}
        <div className="relative p-5 sm:p-6 space-y-2">
          {visibleChanges.map((change, ci) => (
            <ChangeItem key={ci} change={change} index={ci} />
          ))}

          {hasMore && (
            <motion.button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                border border-white/[0.06] bg-white/[0.02] text-sm text-slate-400
                hover:text-white hover:bg-white/[0.04] hover:border-white/[0.1]
                transition-all duration-300"
            >
              {showAll ? (
                <>
                  Show less
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                </>
              ) : (
                <>
                  Show {release.changes.length - 5} more changes
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Year Divider ────────────────────────────────────────── */

function YearDivider({ year }: { year: string }) {
  return (
    <div className="relative flex items-center gap-4 py-4">
      <div className="absolute -left-[2.3rem] sm:-left-[2.8rem] w-4 h-4 rounded-full border-2 border-violet-400/40 bg-violet-500/15 z-10 flex items-center justify-center">
        <Star className="w-2 h-2 text-violet-400" />
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-violet-400/30 via-violet-400/10 to-transparent" />
      <span className="text-sm font-bold text-violet-400/70 uppercase tracking-wider">
        {year}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-violet-400/30 via-violet-400/10 to-transparent" />
    </div>
  );
}

/* ─── Filter Bar ──────────────────────────────────────────── */

function FilterBar({
  activeTag,
  onSelect,
  searchQuery,
  onSearch,
}: {
  activeTag: ChangeTag | null;
  onSelect: (tag: ChangeTag | null) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}) {
  return (
    <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
      <div className="space-y-4 mb-12">
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Command className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search changes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03]
              text-sm text-white placeholder:text-slate-500
              focus:outline-none focus:border-emerald-400/30 focus:ring-1 focus:ring-emerald-400/20
              transition-all duration-300"
          />
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => onSelect(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border
              ${
                activeTag === null
                  ? 'bg-white/[0.08] border-white/[0.15] text-white'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            All Changes
          </button>
          {ALL_TAGS.map((tag) => {
            const config = TAG_CONFIG[tag];
            const Icon = config.icon;
            const count = releases.reduce(
              (sum, r) => sum + r.changes.filter((c) => c.tag === tag).length,
              0,
            );
            return (
              <button
                key={tag}
                onClick={() => onSelect(tag)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border
                  ${
                    activeTag === tag
                      ? `bg-white/[0.08] border-white/[0.15] text-white shadow-[0_0_20px_rgba(${config.colorRgb},0.1)]`
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <Icon className="w-3 h-3" />
                {config.label}
                <span className="text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ─── Release Timeline Visual ─────────────────────────────── */

function ReleaseTimelineVisual() {
  /* Build per-release data with change counts for the bar chart */
  const timelineData = useMemo(() => {
    return releases
      .slice()
      .reverse()
      .map((r) => {
        const features = r.changes.filter(
          (c) => c.tag === 'feature' || c.tag === 'integration',
        ).length;
        const security = r.changes.filter(
          (c) => c.tag === 'security' || c.tag === 'enterprise',
        ).length;
        const fixes = r.changes.filter(
          (c) => c.tag === 'fix' || c.tag === 'improvement',
        ).length;
        return {
          version: r.version,
          codename: r.codename,
          date: r.date,
          isMajor: r.isMajor,
          total: r.changes.length,
          features,
          security,
          fixes,
        };
      });
  }, []);

  const maxChanges = Math.max(...timelineData.map((d) => d.total));
  const chartHeight = 280; // px - fixed reference for bar heights

  return (
    <DeferredSection minHeight={200}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Release Cadence
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5">
              Shipping{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                every month
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Consistent delivery cadence with monthly releases, quarterly major
              versions, and continuous security patches - {releases.length}{' '}
              releases across {monthsActive} months.
            </p>
          </ScrollReveal>

          {/* Enterprise activity chart */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            {/* Chart header */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-cyan-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Release Activity
                  </h3>
                  <p className="text-xs text-slate-500">
                    Changes shipped per version
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/60" />
                  Features &amp; Integrations
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-violet-400/60" />
                  Security &amp; Enterprise
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-400/50" />
                  Improvements &amp; Fixes
                </div>
              </div>
            </div>

            {/* Bar chart area */}
            <SectionChoreography pattern="stagger-wave" stagger={0.03}>
              <div className="relative px-6 sm:px-8 pb-2">
                {/* Y-axis scale labels + grid lines */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-full pointer-events-none"
                  aria-hidden
                >
                  {[1, 0.75, 0.5, 0.25, 0].map((pct) => (
                    <div
                      key={pct}
                      className="absolute left-0 right-0 flex items-center"
                      style={{ top: `${(1 - pct) * 100}%` }}
                    >
                      <span className="hidden sm:block text-[10px] text-slate-600 w-8 text-right pr-2 -mt-2">
                        {Math.round(maxChanges * pct)}
                      </span>
                      <div className="flex-1 border-t border-dashed border-white/[0.04]" />
                    </div>
                  ))}
                </div>

                {/* Bars container */}
                <div
                  className="relative flex items-end gap-1 sm:gap-1.5 sm:ml-9"
                  style={{ height: `${chartHeight}px` }}
                >
                  {timelineData.map((d, i) => {
                    const barPx = Math.max(
                      4,
                      (d.total / maxChanges) * chartHeight,
                    );
                    const featPct =
                      d.total > 0 ? (d.features / d.total) * 100 : 0;
                    const secPct =
                      d.total > 0 ? (d.security / d.total) * 100 : 0;
                    const fixPct = 100 - featPct - secPct;
                    return (
                      <motion.div
                        key={d.version}
                        className="group relative flex-1 flex flex-col items-center justify-end"
                        style={{ height: '100%' }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: i * 0.03,
                          duration: 0.4,
                        }}
                      >
                        {/* Tooltip on hover */}
                        <div
                          className="absolute -top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200
                          whitespace-nowrap px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-slate-900/95 backdrop-blur-sm shadow-2xl"
                        >
                          <div className="text-xs font-bold text-white">
                            {d.version}{' '}
                            <span className="font-medium text-slate-400">
                              &ldquo;{d.codename}&rdquo;
                            </span>
                            {d.isMajor && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
                                Major
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                            <span className="text-emerald-400">
                              {d.features} feat
                            </span>
                            <span className="text-violet-400">
                              {d.security} sec
                            </span>
                            <span className="text-amber-400">
                              {d.fixes} fix
                            </span>
                            <span className="text-slate-500">
                              •{' '}
                              {new Date(d.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Change count on top of bar */}
                        <motion.span
                          className="text-[10px] font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 0.5 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03 + 0.8 }}
                        >
                          {d.total}
                        </motion.span>

                        {/* The bar itself */}
                        <motion.div
                          className={`w-full rounded-t-md overflow-hidden cursor-default transition-all duration-300
                            ${d.isMajor ? 'ring-1 ring-emerald-400/20' : ''}
                            group-hover:ring-1 group-hover:ring-white/20 group-hover:brightness-125`}
                          style={{ height: 0 }}
                          initial={{ height: 0 }}
                          whileInView={{ height: barPx }}
                          viewport={{ once: true }}
                          transition={{
                            delay: i * 0.03 + 0.15,
                            duration: 0.8,
                            ease: EASE_OUT_EXPO,
                          }}
                        >
                          <div className="h-full w-full flex flex-col-reverse">
                            <div
                              className="w-full bg-gradient-to-t from-emerald-500/50 to-emerald-400/30"
                              style={{ height: `${featPct}%` }}
                            />
                            <div
                              className="w-full bg-gradient-to-t from-violet-500/50 to-violet-400/30"
                              style={{ height: `${secPct}%` }}
                            />
                            <div
                              className="w-full bg-gradient-to-t from-amber-500/40 to-amber-400/25"
                              style={{ height: `${fixPct}%` }}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* X-axis line */}
                <div className="sm:ml-9 h-px bg-white/[0.08]" />
              </div>
            </SectionChoreography>

            {/* Version labels (below chart) */}
            <div className="flex gap-1 sm:gap-1.5 px-6 sm:px-8 sm:ml-9 mt-2 mb-1 overflow-x-auto">
              {timelineData.map((d) => (
                <div key={d.version} className="flex-1 text-center min-w-0">
                  <span
                    className={`text-[8px] sm:text-[10px] font-semibold leading-tight block truncate
                      ${d.isMajor ? 'text-emerald-400' : 'text-slate-500'}`}
                  >
                    {d.version}
                  </span>
                  <span className="text-[7px] sm:text-[9px] text-slate-600 block">
                    {new Date(d.date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom stats row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mx-6 sm:mx-8 mt-4 mb-6 sm:mb-8 pt-5 border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-8">
                {[
                  {
                    label: 'Avg. changes / release',
                    value: Math.round(totalChanges / releases.length),
                    color: 'text-white',
                  },
                  {
                    label: 'Major releases',
                    value: majorReleases,
                    color: 'text-emerald-400',
                  },
                  {
                    label: 'Total features',
                    value: totalFeatures,
                    color: 'text-cyan-400',
                  },
                  {
                    label: 'Release frequency',
                    value: `${Math.round((releases.length / monthsActive) * 10) / 10}/mo`,
                    color: 'text-white',
                  },
                ].map((s) => (
                  <div key={s.label} className="text-center sm:text-left">
                    <div className={`text-xl font-bold ${s.color}`}>
                      {s.value}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="relative w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                    <span className="relative block w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  Major release
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-slate-500/40" />
                  Minor / Patch
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Tag Breakdown Section ───────────────────────────────── */

function TagBreakdownSection() {
  const tagBreakdown = useMemo(() => {
    return ALL_TAGS.map((tag) => {
      const config = TAG_CONFIG[tag];
      const count = releases.reduce(
        (sum, r) => sum + r.changes.filter((c) => c.tag === tag).length,
        0,
      );
      return { tag, config, count };
    }).sort((a, b) => b.count - a.count);
  }, []);

  const maxCount = Math.max(...tagBreakdown.map((t) => t.count));

  return (
    <DeferredSection minHeight={300}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 mb-6">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                By Category
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Change{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                breakdown
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Distribution of changes across categories - reflecting our focus
              on features, security, and enterprise capabilities.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.06}>
            <div className="space-y-3">
              {tagBreakdown.map((item) => {
                const Icon = item.config.icon;
                const pct = Math.round((item.count / totalChanges) * 100);
                return (
                  <div
                    key={item.tag}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg border ${item.config.border} ${item.config.bg} flex items-center justify-center`}
                        >
                          <Icon className={`w-4 h-4 ${item.config.text}`} />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {item.config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {item.count}
                        </span>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: `rgba(${item.config.colorRgb}, 0.5)`,
                        }}
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${(item.count / maxCount) * 100}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.8,
                          ease: EASE_OUT_EXPO,
                          delay: 0.2,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Version History Table ───────────────────────────────── */

function VersionHistoryTable() {
  return (
    <DeferredSection minHeight={400}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Version History
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Complete{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                release history
              </span>
            </h2>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.04}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Version
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                  Date
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Changes
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                  Type
                </span>
              </div>

              {/* Table rows */}
              {releases.map((release, i) => (
                <div
                  key={release.version}
                  className={`group grid grid-cols-[1fr,auto,auto,auto] gap-4 px-5 py-3.5 items-center
                    transition-all duration-200 hover:bg-white/[0.03]
                    ${i < releases.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {release.version}
                    </span>
                    <span className="text-xs text-slate-500">
                      {release.codename}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {new Date(release.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-white font-medium text-center">
                    {release.changes.length}
                  </span>
                  <span className="hidden sm:block">
                    {release.isMajor ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
                        <Rocket className="w-2.5 h-2.5" />
                        Major
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/[0.08] bg-white/[0.03] text-slate-400">
                        <Package className="w-2.5 h-2.5" />
                        Minor
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Notable Milestones ──────────────────────────────────── */

const milestones = [
  {
    icon: Rocket,
    title: 'Platform Launch',
    date: 'January 2025',
    description:
      'FormaOS v1.0.0 Genesis launched with ISO 27001 framework pack and core compliance infrastructure.',
    accentRgb: '52,211,153',
  },
  {
    icon: Shield,
    title: 'Evidence Vault Shipped',
    date: 'August 2025',
    description:
      'SHA-256 cryptographic evidence verification with immutable chain-of-custody and version control.',
    accentRgb: '139,92,246',
  },
  {
    icon: Layers,
    title: '7 Framework Packs',
    date: 'January 2026',
    description:
      'Full coverage across ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, and CIS Controls.',
    accentRgb: '34,211,238',
  },
  {
    icon: Lock,
    title: 'Enterprise SSO & SCIM',
    date: 'February 2026',
    description:
      'SAML 2.0 SSO with Okta, Azure AD, and Google Workspace plus SCIM 2.0 automated provisioning.',
    accentRgb: '251,113,133',
  },
  {
    icon: Workflow,
    title: 'Platform Infrastructure Overhaul',
    date: 'April 2026',
    description:
      'v3.0 Nexus: integrations engine, REST API v1, report generator, webhook relay, AI insights, and scheduled tasks.',
    accentRgb: '59,130,246',
  },
  {
    icon: Eye,
    title: 'Enterprise Governance Expansion',
    date: 'April 2026',
    description:
      'v3.1 Citadel: framework cross-mapping, task management, permissions matrix, policy lifecycle, dashboard builder, and integration marketplace.',
    accentRgb: '245,158,11',
  },
  {
    icon: Sparkles,
    title: 'Enterprise Marketing & Growth',
    date: 'April 2026',
    description:
      'v3.6 Horizon: 100x homepage redesign, comprehensive SEO engine, LCP performance fix, 5-theme enterprise upgrade, and full product maturity infrastructure.',
    accentRgb: '52,211,153',
  },
  {
    icon: Shield,
    title: 'Foundation Audit',
    date: 'May 2026',
    description:
      'v4.0 Foundation Audit: closed seven blockers and thirteen high-severity findings — real row-level security on fourteen multi-tenant tables, MFA enforced at login, signed trust packets, default-on CSRF, hardened SAML, AUD/GST checkout, and CI gates that actually block merges.',
    accentRgb: '139,92,246',
  },
  {
    icon: Layers,
    title: 'Compliance Substrate',
    date: 'May 2026',
    description:
      'v4.2 Compliance Foundations: per-control evaluator registry, framework packs expanded to all 64 SOC 2 TSC criteria and 93 ISO 27001:2022 Annex A controls, twelve working SOC 2 evaluators, and a real PDF report engine with brand typography for board packs and posture reports.',
    accentRgb: '34,211,238',
  },
];

function MilestonesSection() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <Milestone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Key Milestones
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              The journey from{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Genesis to Horizon
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              {monthsActive} months of continuous development - from
              single-framework launch to enterprise compliance operating system.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.08}>
            <div className="relative">
              {/* Timeline spine */}
              <div className="absolute left-8 sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/40 via-blue-400/20 to-amber-400/30" />

              <div className="space-y-6">
                {milestones.map((ms, i) => {
                  const MsIcon = ms.icon;
                  const isEven = i % 2 === 0;
                  return (
                    <div
                      key={ms.title}
                      className={`relative flex items-start gap-6 ${
                        isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                      }`}
                    >
                      <div
                        className="absolute left-8 sm:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10"
                        style={{
                          borderColor: `rgba(${ms.accentRgb}, 0.6)`,
                          backgroundColor: `rgba(${ms.accentRgb}, 0.15)`,
                          boxShadow: `0 0 14px rgba(${ms.accentRgb}, 0.2)`,
                        }}
                      />

                      <div
                        className={`ml-20 sm:ml-0 sm:w-[calc(50%-2rem)] ${
                          isEven ? '' : 'sm:ml-auto'
                        }`}
                      >
                        <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className="shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center"
                              style={{
                                borderColor: `rgba(${ms.accentRgb}, 0.2)`,
                                backgroundColor: `rgba(${ms.accentRgb}, 0.08)`,
                              }}
                            >
                              <MsIcon
                                className="w-5 h-5"
                                style={{ color: `rgba(${ms.accentRgb}, 1)` }}
                              />
                            </div>
                            <div>
                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: `rgba(${ms.accentRgb}, 0.6)` }}
                              >
                                {ms.date}
                              </span>
                              <h3 className="text-base font-semibold text-white mt-0.5">
                                {ms.title}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {ms.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Stats Section ───────────────────────────────────────── */

function StatsSection() {
  return (
    <DeferredSection minHeight={200}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10">
            <ScrollReveal
              variant="fadeUp"
              range={[0, 0.3]}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Development velocity
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                {monthsActive} months of continuous shipping - features, fixes,
                and enterprise capabilities delivered every month.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {changelogStats.map((stat, i) => (
                <AnimatedStat
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  suffix={stat.suffix}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Subscribe CTA ───────────────────────────────────────── */

function SubscribeCTA() {
  return (
    <DeferredSection minHeight={350}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.08), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(34,211,238,0.06), transparent 50%)',
              }}
            />

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-emerald-400/30"
                  style={{
                    left: `${12 + ((i * 76) % 80)}%`,
                    top: `${8 + ((i * 53) % 85)}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.4,
                  }}
                />
              ))}
            </div>

            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <ScrollReveal variant="depthScale" range={[0, 0.3]}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Stay Updated
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Never miss a{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                    release
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  Get notified when we ship new features, framework packs, and
                  platform improvements. No spam - just releases.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={compliancePlanHref('changelog_final')}
                    className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      bg-gradient-to-r from-emerald-500 to-teal-500
                      text-white font-semibold text-sm
                      shadow-lg shadow-emerald-500/20
                      hover:shadow-xl hover:shadow-emerald-500/30
                      transition-all duration-300"
                  >
                    {PUBLIC_CTA_LABELS.compliancePlan}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    Explore Features
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    `${releases.length} releases shipped`,
                    `${totalChanges}+ changes delivered`,
                    'Monthly release cadence',
                    `${monthsActive} months of development`,
                  ].map((signal) => (
                    <div key={signal} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400/50" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Hero ────────────────────────────────────────────────── */

function ChangelogHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: 'rgba(52,211,153,0.12)' }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.12, 0.18, 0.12],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'rgba(139,92,246,0.10)' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.16, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />
        <motion.div
          className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgba(34,211,238,0.06)' }}
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 6,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 py-32 sm:py-40 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-8"
        >
          <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Changelog
          </span>
        </motion.div>

        {/* Audit 2026-05-24: H1 + intro <p> were wrapped in motion.* with
         * opacity 0 initial, which made LCP fall back to the cookie-banner
         * text and pushed /changelog Lighthouse perf to 65 (LCP 8.0 s).
         * Both now render eagerly with no opacity gate so LCP attaches to
         * real hero content instead of the banner. */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6">
          Every change,
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            shipped transparently
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {releases.length} releases, {totalChanges}+ changes, and{' '}
          {monthsActive} months of continuous development. See exactly what we
          shipped and when.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-400/15 bg-emerald-500/5 text-sm text-emerald-400">
            <GitMerge className="w-4 h-4" />
            Latest: {releases[0].version} {releases[0].codename}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            {new Date(releases[0].date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-3"
        >
          {ALL_TAGS.map((tag) => {
            const config = TAG_CONFIG[tag];
            const Icon = config.icon;
            const count = releases.reduce(
              (sum, r) => sum + r.changes.filter((c) => c.tag === tag).length,
              0,
            );
            return (
              <div
                key={tag}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-400"
              >
                <Icon className={`w-3 h-3 ${config.text}`} />
                {config.label}
                <span className="text-slate-600">{count}</span>
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas-900 to-transparent pointer-events-none" />
    </section>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export default function ChangelogPageContent() {
  const [activeTag, setActiveTag] = useState<ChangeTag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReleases = useMemo(() => {
    let result = releases;

    if (activeTag) {
      result = result
        .map((r) => ({
          ...r,
          changes: r.changes.filter((c) => c.tag === activeTag),
        }))
        .filter((r) => r.changes.length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result
        .map((r) => ({
          ...r,
          changes: r.changes.filter(
            (c) =>
              c.text.toLowerCase().includes(q) ||
              c.detail?.toLowerCase().includes(q),
          ),
        }))
        .filter(
          (r) =>
            r.changes.length > 0 ||
            r.version.toLowerCase().includes(q) ||
            r.codename.toLowerCase().includes(q),
        );
    }

    return result;
  }, [activeTag, searchQuery]);

  // Group releases by year for year dividers
  const releasesWithYears = useMemo(() => {
    const items:
      | { type: 'year'; year: string }[]
      | { type: 'release'; release: ChangelogRelease; index: number }[] = [];
    const result: Array<
      | { type: 'year'; year: string }
      | { type: 'release'; release: ChangelogRelease; index: number }
    > = [];
    let lastYear = '';

    filteredReleases.forEach((release, i) => {
      const year = release.date.split('-')[0];
      if (year !== lastYear) {
        result.push({ type: 'year', year });
        lastYear = year;
      }
      result.push({ type: 'release', release, index: i });
    });

    return result;
  }, [filteredReleases]);

  return (
    <MarketingPageShell>
      <ChangelogHero />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <StatsSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <ReleaseTimelineVisual />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Release Timeline */}
      <DeferredSection minHeight={600}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-6"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Release{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  timeline
                </span>
              </h2>
              <p className="text-base text-slate-400 max-w-xl mx-auto">
                Every version, every change, with full details. Filter by
                category or search for specific changes.
              </p>
            </ScrollReveal>

            <FilterBar
              activeTag={activeTag}
              onSelect={setActiveTag}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />

            {/* Timeline spine */}
            <div className="relative pl-8 sm:pl-10">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/30 via-white/10 to-violet-400/20" />

              <div className="space-y-6">
                {releasesWithYears.map((item, i) => {
                  if (item.type === 'year') {
                    return (
                      <YearDivider key={`year-${item.year}`} year={item.year} />
                    );
                  }
                  return (
                    <ReleaseCard
                      key={item.release.version}
                      release={item.release}
                      index={item.index}
                      isLatest={item.index === 0 && !activeTag && !searchQuery}
                    />
                  );
                })}
              </div>

              {filteredReleases.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500">
                    No releases match your current filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <TagBreakdownSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <VersionHistoryTable />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <MilestonesSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <SubscribeCTA />
    </MarketingPageShell>
  );
}
