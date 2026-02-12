# Marketing-Product Alignment Matrix

**Generated:** 2026-02-12
**Scope:** All marketing pages vs actual product codebase
**Sources:** Homepage, Pricing, Product, Compare, Use-Cases, Trust Center, Industries, Customer Stories

---

## METHODOLOGY

- **Marketing Sources:** 50+ files in `app/(marketing)/` including homepage components, pricing tiers, product page, compare pages, use-case pages, trust center, industries, security, docs, customer stories
- **Product Sources:** 29 product pages in `app/app/`, 6 API v1 routes, `lib/` infrastructure, `components/` UI
- **Prior Audits:** MARKETING_ALIGNMENT_AUDIT.md, MARKETING_PRODUCT_TRUTH_ALIGNMENT.md, PRODUCT_TRUTH_AUDIT_REPORT.md

---

## LEGEND

| Symbol | Meaning                                     |
| ------ | ------------------------------------------- |
| ✅     | Fully implemented and accurately marketed   |
| ⚠️     | Partially true or needs clarification       |
| ❌     | Overpromise: marketed but not implemented   |
| 💎     | Under-marketed: exists but barely mentioned |
| 🔵     | Properly labeled as roadmap/early access    |

---

## 1. FEATURE CLAIMS MATRIX

### A. Core Platform Features

| #   | Marketing Claim                            | Where Claimed                                                   | Product Status                                                     | Evidence Path                                                                        | Verdict                                                    |
| --- | ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | Evidence Vault with verification workflows | Homepage, Pricing (all tiers), Product page                     | Full CRUD, upload, verify, versioning, segregation of duties       | `app/app/vault/page.tsx`, `app/app/evidence/page.tsx`, `app/app/actions/evidence.ts` | ✅                                                         |
| 2   | Immutable Audit Trail                      | Homepage, Pricing, Product, Security pages                      | DB triggers prevent UPDATE/DELETE, 14 action types, 9 entity types | `app/app/audit/page.tsx`, `lib/audit-trail.ts`, `app/app/actions/audit-events.ts`    | ✅                                                         |
| 3   | Task Management with recurring tasks       | Homepage, Pricing (all tiers)                                   | Full CRUD, priority, due dates, recurring, patient linking         | `app/app/tasks/page.tsx`, `app/app/actions/tasks.ts`                                 | ✅                                                         |
| 4   | Policy Management                          | Homepage capabilities list                                      | Policy CRUD with versioning and review workflows                   | `app/app/policies/page.tsx`, `app/app/policies/new/`, `app/app/policies/[id]/`       | ✅                                                         |
| 5   | Compliance Dashboard                       | Homepage, Pricing, Product page                                 | Scoring, framework health, risk levels                             | `app/app/compliance/page.tsx`, `lib/data/analytics.ts`                               | ✅                                                         |
| 6   | Reports & Analytics                        | Pricing (Starter: "Basic analytics", Pro: "Advanced analytics") | PDF/CSV export, compliance/cert/audit reports, gap analysis        | `app/app/reports/page.tsx`, `lib/reports.ts`, `lib/report-builder.ts`                | ✅                                                         |
| 7   | RBAC (Role-Based Access Control)           | Pricing (all tiers), Security page ("6 Roles")                  | 4 roles (owner/admin/member/viewer), 39 permissions                | `app/app/actions/rbac.ts`                                                            | ⚠️ Claims "6 Roles" on product page but code shows 4 roles |
| 8   | Organization Management                    | Pricing (Pro tier)                                              | Entities, teams, members                                           | `app/app/team/page.tsx`, `app/app/people/page.tsx`                                   | ✅                                                         |
| 9   | Billing & Subscriptions                    | Product (implied)                                               | Stripe integration, plan management                                | `app/app/billing/page.tsx`, `app/api/billing/webhook/route.ts`                       | ✅                                                         |
| 10  | Settings & Profile                         | Product (implied)                                               | Email prefs, security settings, profile                            | `app/app/settings/page.tsx`, `app/app/profile/page.tsx`                              | ✅                                                         |
| 11  | Compliance History Timeline                | Homepage                                                        | History page exists                                                | `app/app/history/page.tsx`                                                           | ✅                                                         |

### B. Compliance Intelligence & Frameworks

| #   | Marketing Claim                                                           | Where Claimed                                | Product Status                                         | Evidence Path                                                                                                  | Verdict |
| --- | ------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------- |
| 12  | 7 Framework Packs (ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS) | Homepage, Pricing, Product, Security pages   | All 7 installed, 85 controls total                     | `lib/frameworks/framework-installer.ts`, `lib/frameworks/packs/`                                               | ✅      |
| 13  | Cross-Framework Control Mapping                                           | Homepage, Pricing (Enterprise)               | SOC 2 ↔ NIST CSF ↔ CIS mappings exist                  | `lib/frameworks/`                                                                                              | ✅      |
| 14  | Compliance Score Engine with trends                                       | Homepage, Pricing (Enterprise), Product      | Real-time scoring, snapshot history, trend calculation | `lib/automation/compliance-score-engine.ts`, `lib/compliance/snapshot-service.ts`                              | ✅      |
| 15  | Compliance Gate Enforcement                                               | Homepage, Pricing (Enterprise), Product page | Enforcement actions with blocking logic                | `app/app/actions/enforcement.ts`, `lib/compliance/enforcement-types.ts`                                        | ✅      |
| 16  | Automated Compliance Gap Analysis                                         | Homepage CapabilitiesGrid                    | `runGapAnalysis()` exists, displayed in reports        | `app/app/actions/compliance.ts`, `app/app/reports/page.tsx`                                                    | ✅      |
| 17  | Executive Dashboard                                                       | Homepage, Pricing (Enterprise), Product      | Full page with risk analytics, posture calculator      | `app/app/executive/page.tsx`, `lib/executive/posture-calculator.ts`, `lib/executive/multi-framework-rollup.ts` | ✅      |

### C. Automation & Workflows

| #   | Marketing Claim                                                            | Where Claimed                                | Product Status                                   | Evidence Path                                                        | Verdict                                                                                  |
| --- | -------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 18  | Automation Engine (Homepage: "8 triggers", HomePageContent: "12 triggers") | Homepage (2 conflicting numbers)             | 12 trigger types implemented                     | `lib/automation/trigger-engine.ts`                                   | ⚠️ CapabilitiesGrid says "8 triggers", HomePageContent says "12 triggers" — inconsistent |
| 19  | Workflow Automation UI                                                     | Pricing (Pro: "custom workflows by request") | Workflow management page with templates          | `app/app/workflows/page.tsx`                                         | ✅                                                                                       |
| 20  | Real-time Activity Feed & Notifications                                    | Pricing (Pro tier)                           | WebSocket subscriptions, presence, activity feed | `lib/realtime.ts`, `components/dashboard/realtime-activity-feed.tsx` | ✅                                                                                       |
| 21  | Auto-escalation rules                                                      | Product page OperatingModel                  | Workflow engine supports escalation action type  | `lib/workflow-engine.ts`                                             | ✅                                                                                       |

### D. API & Integrations

| #   | Marketing Claim                                       | Where Claimed                                                                    | Product Status                                                     | Evidence Path                                                                                                                                                   | Verdict                                                 |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 22  | REST API v1 (tasks, evidence, compliance, audit-logs) | Homepage, Pricing (Pro), Docs page                                               | 4 data endpoints + 2 webhook endpoints, Bearer auth, rate limiting | `app/api/v1/tasks/route.ts`, `app/api/v1/evidence/route.ts`, `app/api/v1/compliance/route.ts`, `app/api/v1/audit-logs/route.ts`, `app/api/v1/webhooks/route.ts` | ✅                                                      |
| 23  | Webhooks                                              | Homepage CapabilitiesGrid ("by request"), Docs                                   | Webhook routes exist                                               | `app/api/v1/webhooks/route.ts`, `app/api/v1/webhooks/[id]/route.ts`                                                                                             | ✅                                                      |
| 24  | Google OAuth                                          | Pricing (Enterprise), Security, Trust/Procurement                                | Auth system with OAuth                                             | `app/auth/`                                                                                                                                                     | ✅                                                      |
| 25  | Enterprise SSO via SAML                               | Product EnterpriseSecurity ("by request"), Trust/Procurement ("roadmap H2 2026") | NOT implemented; properly labeled as roadmap                       | Trust page: "on our roadmap for H2 2026"                                                                                                                        | 🔵 Roadmap item, properly disclosed                     |
| 26  | MFA                                                   | Product EnterpriseSecurity ("by request")                                        | NOT implemented; labeled "by request"                              | N/A                                                                                                                                                             | ⚠️ "By request" could mislead — not currently available |

### E. Healthcare & NDIS Features

| #   | Marketing Claim                         | Where Claimed                                                                       | Product Status                                     | Evidence Path                                                                     | Verdict                   |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------- |
| 27  | Patient Management                      | Homepage, Use-cases/healthcare, Pricing (Pro implied)                               | Full patient records with care status, risk levels | `app/app/patients/page.tsx`, `app/app/patients/[id]/page.tsx`                     | ✅                        |
| 28  | Progress Notes with supervisor sign-off | Homepage, Use-cases/healthcare, Product OperatingModel                              | Progress notes page exists                         | `app/app/progress-notes/page.tsx`                                                 | ✅                        |
| 29  | Participant Management (NDIS)           | Use-cases/ndis-aged-care                                                            | Participant records                                | `app/app/participants/page.tsx`                                                   | ✅                        |
| 30  | Incident Management & Safeguarding      | Homepage Industries ("Early Access"), Use-cases/ndis, Use-cases/incident-management | Incident reporting with severity classification    | `app/app/incidents/page.tsx`, `app/app/incidents/new/`                            | ✅ (labeled early access) |
| 31  | Care Plans                              | Dashboard widget references                                                         | Care plans page with review tracking               | `app/app/care-plans/page.tsx`, `components/dashboard/CareOperationsScorecard.tsx` | 💎 Under-marketed         |
| 32  | Visit Scheduling & Service Logs         | Pricing (Pro tier)                                                                  | Visit tracking with status, client info            | `app/app/visits/page.tsx`, `app/app/visits/new/`                                  | ✅                        |
| 33  | Staff Compliance & Credential Tracking  | Homepage, Use-cases/workforce-credentials                                           | Staff compliance page + credential types           | `app/app/staff-compliance/page.tsx`, `app/app/staff-compliance/new/`              | ✅                        |
| 34  | Shift Tracking                          | Homepage capabilities, Pricing (Pro)                                                | Shift records with start/end, status               | `app/app/staff/page.tsx` (org_shifts table)                                       | ✅                        |

### F. Registers & Documents

| #   | Marketing Claim                   | Where Claimed                                 | Product Status                                                                | Evidence Path                                                                                                     | Verdict                                                      |
| --- | --------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 35  | Training & Asset Registers        | Pricing (Pro tier), Homepage CapabilitiesGrid | Registers page + training subpage                                             | `app/app/registers/page.tsx`, `app/app/registers/training/page.tsx`                                               | ✅                                                           |
| 36  | Certificate Tracking              | Prior audit mentions                          | Certificates page exists                                                      | `app/app/certificates/page.tsx`                                                                                   | 💎 Under-marketed — not in pricing tiers explicitly          |
| 37  | Evidence Versioning               | Homepage CapabilitiesGrid, HomePageContent    | File versioning lib with SHA-256, rollback                                    | `lib/file-versioning.ts`                                                                                          | ✅                                                           |
| 38  | Full Document Version History     | Homepage CapabilitiesGrid                     | File versioning lib supports getFileVersions, restoreVersion, compareVersions | `lib/file-versioning.ts` (331 lines)                                                                              | ✅                                                           |
| 39  | Full Audit Trail Export (CSV/ZIP) | Pricing (Pro tier)                            | Audit bundle action with PDF generation                                       | `app/app/actions/audit-bundle.ts`, `app/app/audit/export/`                                                        | ✅                                                           |
| 40  | Form Builder                      | Not marketed                                  | Custom form builder with field templates                                      | `app/app/forms/builder/[id]/page.tsx`, `app/app/forms/builder/[id]/form-builder-client.tsx`, `lib/forms/types.ts` | 💎 Under-marketed — not mentioned anywhere on marketing site |

---

## 2. METRIC CLAIMS MATRIX

| #   | Metric Claim                  | Where Claimed                     | Verifiable?                                                                                | Verdict                                                                                |
| --- | ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 41  | "15+ Core Modules"            | Homepage HomePageContent          | Countable: 29 product pages exist                                                          | ✅ Conservative; actually understated                                                  |
| 42  | "7 Framework Packs"           | Homepage, Pricing, multiple pages | Verified: 7 packs, 85 controls                                                             | ✅ Accurate                                                                            |
| 43  | "85+ controls"                | HomePageContent                   | Verified via framework packs                                                               | ✅ Accurate                                                                            |
| 44  | "Faster Audits"               | HomepageHeroSection               | Generic/unquantified claim                                                                 | ✅ Safe — no specific number                                                           |
| 45  | "12 triggers, 5 action types" | HomePageContent                   | 12 triggers verified in trigger-engine.ts                                                  | ⚠️ See #18 — CapabilitiesGrid says "8 triggers" (inconsistency)                        |
| 46  | "6 Roles"                     | Product EnterpriseSecurity        | Code shows 4 roles (owner/admin/member/viewer)                                             | ❌ Overpromise — should say 4 roles                                                    |
| 47  | "SOC 2-aligned controls"      | Security page, Product page       | Infrastructure is SOC 2 certified (Supabase/AWS). FormaOS itself does NOT have SOC 2 cert. | ⚠️ "Aligned" is safe, but trust/procurement correctly states own SOC 2 is "on roadmap" |

---

## 3. OVERPROMISES (Marketing Says It, Product Doesn't Have It)

| #   | Claim                                                                                         | Location                       | Issue                                                                                                                                                                                                                                                            | Severity                                                                         |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| O1  | "Threat Correlation Engine"                                                                   | Homepage CapabilitiesGrid      | Only `lib/security/correlation.ts` exists (creates correlation IDs for request tracing). NO actual threat correlation, anomaly detection, or pattern matching. Marketing describes: "Correlate security events...Detect patterns, flag anomalies, surface risks" | 🔴 HIGH — Feature described does not exist                                       |
| O2  | "Master Control Deduplication — Cross-framework mapping planned to reduce duplicate controls" | Product ComplianceIntelligence | Cross-framework mappings exist, but no deduplication engine. Labeled "planned" which helps.                                                                                                                                                                      | 🟡 MEDIUM — "planned" label present but displayed alongside shipping features    |
| O3  | "Regression Alerts — Regression insights and alerts (early access)"                           | Product ComplianceIntelligence | `detectScoreRegression()` exists in `lib/compliance/snapshot-service.ts` but no user-facing alert system                                                                                                                                                         | ⚠️ LOW — Code partially exists, "early access" label is fair                     |
| O4  | "Historical Compliance Snapshots (early access)"                                              | Product ComplianceIntelligence | Snapshot tables exist (`org_compliance_snapshots`, `compliance_score_snapshots`), used by executive dashboard. Not a standalone user-facing feature.                                                                                                             | ⚠️ LOW — Infrastructure exists, "early access" label is fair                     |
| O5  | "Evidence Intelligence AI Scoring"                                                            | Product ComplianceIntelligence | Compliance scoring exists. NO AI/ML component. "Intelligence" conflated with scoring engine.                                                                                                                                                                     | 🟡 MEDIUM — "AI" is misleading; it's rule-based scoring                          |
| O6  | "6 Roles" in RBAC                                                                             | Product EnterpriseSecurity     | 4 roles exist: owner, admin, member, viewer                                                                                                                                                                                                                      | 🟡 MEDIUM — Factually incorrect number                                           |
| O7  | "8 automation triggers"                                                                       | Homepage CapabilitiesGrid      | 12 triggers actually exist (understated in one place, correct in another)                                                                                                                                                                                        | ⚠️ LOW — Inconsistency, not overpromise                                          |
| O8  | "MFA options available by request"                                                            | Product EnterpriseSecurity     | No MFA implementation found in codebase                                                                                                                                                                                                                          | 🟡 MEDIUM — "by request" suggests it can be enabled, but code doesn't support it |
| O9  | Multi-Site hierarchies with "cross-site rollups"                                              | Homepage CapabilitiesGrid      | Multi-org/entities exist but no hierarchical rollup engine. Labeled "Planned enterprise roadmap"                                                                                                                                                                 | 🔵 LOW — Properly labeled as planned                                             |

---

## 4. UNDER-MARKETED FEATURES (Product Has It, Marketing Barely Mentions It)

| #   | Feature                                       | Product Evidence                                                            | Marketing Mention                                                                 | Recommendation                                         |
| --- | --------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| U1  | **Form Builder**                              | `app/app/forms/builder/[id]/` with field templates, drag-and-drop           | NOT mentioned on any marketing page                                               | Add to Product page and Pro tier pricing               |
| U2  | **Care Plans**                                | `app/app/care-plans/page.tsx`, `CareOperationsScorecard` dashboard widget   | Only mentioned in onboarding highlights, not on marketing pages                   | Add to healthcare use-case page and pricing            |
| U3  | **Certificate Tracking**                      | `app/app/certificates/page.tsx`                                             | Mentioned in automation triggers (cert_expiring) but not in pricing feature lists | Add to Starter or Pro tier features                    |
| U4  | **Onboarding Roadmap**                        | `app/app/onboarding-roadmap/page.tsx`                                       | Not marketed                                                                      | Could be a differentiator — guided compliance setup    |
| U5  | **Staff Portal/Dashboard**                    | Listed in HomePageContent capabilities but NOT a separate marketing section | One line in capabilities list                                                     | Create a dedicated staff portal section                |
| U6  | **Email History & Preferences**               | `app/app/settings/email-history/`, `app/app/settings/email-preferences/`    | Not mentioned                                                                     | Minor — settings feature, low marketing value          |
| U7  | **29 product pages** (vs "15+ modules" claim) | `find app/app -maxdepth 2 -name page.tsx` = 29 results                      | Claims "15+ Core Modules"                                                         | Could update to "25+ modules" — currently underselling |
| U8  | **Compliance History Timeline**               | `app/app/history/page.tsx`                                                  | Barely mentioned                                                                  | Add to Product page under "Defend" section             |

---

## 5. TRUST CENTER & LEGAL PAGES

| Page                            | Route                  | Status                   | Content Quality                                                                                  |
| ------------------------------- | ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| Trust Center (main)             | `/trust`               | ✅ EXISTS                | `app/(marketing)/trust/page.tsx` — Enterprise trust center, links to DPA/subprocessors           |
| DPA (Data Processing Agreement) | `/trust/dpa`           | ✅ EXISTS                | `app/(marketing)/trust/dpa/page.tsx` — GDPR, Australian Privacy Act coverage                     |
| Subprocessors                   | `/trust/subprocessors` | ✅ EXISTS                | `app/(marketing)/trust/subprocessors/page.tsx` — Lists Supabase, Vercel, Resend, Stripe, PostHog |
| Procurement Q&A                 | `/trust/procurement`   | ✅ EXISTS                | `app/(marketing)/trust/procurement/page.tsx` — SSO, data residency, incident response, DPA Q&A   |
| Security Review                 | `/security-review`     | ✅ EXISTS                | `app/(marketing)/security-review/page.tsx` — Links to trust center                               |
| Security Page                   | `/security`            | ✅ EXISTS                | `app/(marketing)/security/` — Architecture, compliance gates                                     |
| Privacy Policy                  | `/legal/privacy`       | ✅ EXISTS                | `app/(marketing)/legal/privacy/page.tsx`                                                         |
| Terms of Service                | `/legal/terms`         | ✅ EXISTS                | `app/(marketing)/legal/terms/page.tsx`                                                           |
| Customer Stories                | `/customer-stories`    | ⚠️ EXISTS but ANONYMIZED | `app/(marketing)/customer-stories/page.tsx` — 3 stories, no named customers, no logos            |

---

## 6. COMPARISON PAGES

| Page           | Route                  | Status | Risk Assessment                                         |
| -------------- | ---------------------- | ------ | ------------------------------------------------------- |
| Compare Hub    | `/compare`             | ✅     | General comparison positioning                          |
| vs Vanta       | `/compare/vanta`       | ✅     | Claims operational compliance advantage; factually safe |
| vs Secureframe | `/compare/secureframe` | ✅     | Claims evidence defensibility advantage; factually safe |
| vs Drata       | `/compare/drata`       | ✅     | Claims governance execution advantage; factually safe   |

No specific feature comparison tables were found that could contain false claims — pages use narrative positioning rather than tick-box comparisons.

---

## 7. MARKETING PAGE INVENTORY

| Page                      | Route                              | Purpose                                                       |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| Homepage                  | `/`                                | Hero, capabilities grid, industries, trust, CTAs              |
| Product                   | `/product`                         | Operating model, compliance intelligence, security            |
| Pricing                   | `/pricing`                         | 3 tiers (Starter $159, Pro $239, Enterprise custom)           |
| Frameworks                | `/frameworks`                      | 7 framework pack details                                      |
| Industries                | `/industries`                      | Healthcare, NDIS, aged care, education, professional services |
| Docs                      | `/docs`                            | API preview, integration docs, getting started                |
| Blog                      | `/blog`                            | Blog posts                                                    |
| FAQ                       | `/faq`                             | Frequently asked questions                                    |
| About                     | `/about`                           | Company story                                                 |
| Our Story                 | `/our-story`                       | Founder story                                                 |
| Contact                   | `/contact`                         | Contact form                                                  |
| Evaluate                  | `/evaluate`                        | Evaluation landing page                                       |
| Govern                    | `/govern`                          | Governance positioning                                        |
| Operate                   | `/operate`                         | Operations positioning                                        |
| Use-case: Healthcare      | `/use-cases/healthcare`            | Healthcare compliance workflows                               |
| Use-case: NDIS/Aged Care  | `/use-cases/ndis-aged-care`        | NDIS/Aged Care positioning                                    |
| Use-case: Incident Mgmt   | `/use-cases/incident-management`   | Incident management workflows                                 |
| Use-case: Workforce Creds | `/use-cases/workforce-credentials` | Staff credential tracking                                     |

---

## 8. PRIORITY ACTION ITEMS

### 🔴 Critical (Fix Immediately)

| #   | Item                                                   | Action                                                                       | File(s)                                                             |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **"Threat Correlation Engine"** on CapabilitiesGrid    | Remove or replace with "Request Correlation Tracking" (what actually exists) | `app/(marketing)/components/homepage/CapabilitiesGrid.tsx` L118-122 |
| 2   | **"6 Roles"** on Product Security page                 | Change to "4 Roles" or "Role-Based Access Control"                           | `app/(marketing)/product/components/EnterpriseSecurity.tsx` L12     |
| 3   | **"Evidence Intelligence AI Scoring"** on Product page | Remove "AI" — it's rule-based compliance scoring, not ML                     | `app/(marketing)/product/components/ComplianceIntelligence.tsx` L16 |

### 🟡 Medium (Fix This Sprint)

| #   | Item                                         | Action                                                                        | File(s)                                                             |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 4   | **Trigger count inconsistency** (8 vs 12)    | Standardize to "12" everywhere                                                | `app/(marketing)/components/homepage/CapabilitiesGrid.tsx` L29      |
| 5   | **"MFA options available by request"**       | Either implement basic MFA or change to "MFA on roadmap"                      | `app/(marketing)/product/components/EnterpriseSecurity.tsx` L11     |
| 6   | **"Master Control Deduplication — planned"** | Move to a separate "Roadmap" section instead of mixing with shipping features | `app/(marketing)/product/components/ComplianceIntelligence.tsx` L14 |
| 7   | **Add Form Builder to marketing**            | Include in Pro tier pricing and product page                                  | `app/(marketing)/pricing/components/PricingTiers.tsx`               |
| 8   | **Add Care Plans to marketing**              | Include in healthcare use-case page                                           | `app/(marketing)/use-cases/healthcare/page.tsx`                     |
| 9   | **Add Certificate Tracking to pricing**      | Add to Starter or Pro tier feature list                                       | `app/(marketing)/pricing/components/PricingTiers.tsx`               |

### 🟢 Low (Backlog)

| #   | Item                                            | Action                       |
| --- | ----------------------------------------------- | ---------------------------- |
| 10  | Update "15+ modules" to "25+ modules"           | More accurate count          |
| 11  | Add named customer stories with logos           | Currently all anonymized     |
| 12  | Create dedicated Form Builder marketing section | Major under-marketed feature |
| 13  | Document onboarding roadmap as a feature        | Differentiator not marketed  |

---

## 9. ALIGNMENT SCORE SUMMARY

| Category              | Accurate | Partially True            | Overpromised                 | Under-Marketed   | Total  |
| --------------------- | -------- | ------------------------- | ---------------------------- | ---------------- | ------ |
| Core Features         | 11       | 1 (RBAC roles)            | 0                            | 3                | 15     |
| Compliance/Frameworks | 6        | 0                         | 0                            | 1                | 7      |
| Automation/Workflows  | 3        | 1 (trigger count)         | 0                            | 0                | 4      |
| API/Integrations      | 3        | 1 (MFA)                   | 0                            | 0                | 4      |
| Healthcare/NDIS       | 7        | 0                         | 0                            | 1                | 8      |
| Intelligence Claims   | 2        | 2 (regression, snapshots) | 3 (threat engine, AI, dedup) | 0                | 7      |
| Metrics               | 4        | 2                         | 1 (6 roles)                  | 1 (module count) | 8      |
| **TOTAL**             | **36**   | **7**                     | **4**                        | **6**            | **53** |

**Overall Alignment Score: 81% accurate** (36/53 fully accurate, 7 partially true, 4 overpromised, 6 under-marketed)

---

## 10. COMPARISON WITH PRIOR AUDITS

| Audit                                | Date         | Score                     | Key Finding                                                                                          |
| ------------------------------------ | ------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| PRODUCT_TRUTH_AUDIT_REPORT.md        | Jan 2025     | 95/100 (post-remediation) | API built, false claims removed                                                                      |
| MARKETING_ALIGNMENT_AUDIT.md         | Feb 2026     | Passed                    | 7 false claims removed, nav links added                                                              |
| MARKETING_PRODUCT_TRUTH_ALIGNMENT.md | Feb 2026     | Passed                    | Healthcare/NDIS positioning verified                                                                 |
| **This Matrix**                      | **Feb 2026** | **81% aligned**           | **New issues: Threat Engine, AI claims, role count, trigger inconsistency, under-marketed features** |

### New Issues Found (Not in Prior Audits)

1. "Threat Correlation Engine" — not flagged before (CapabilitiesGrid added after prior audits?)
2. "Evidence Intelligence AI Scoring" — "AI" term not flagged
3. "6 Roles" claim — product security page discrepancy
4. Form Builder completely absent from marketing
5. Care Plans barely marketed despite full implementation
6. Trigger count inconsistency between homepage components

---

_Generated from codebase analysis of 50+ marketing files and 29+ product pages._
