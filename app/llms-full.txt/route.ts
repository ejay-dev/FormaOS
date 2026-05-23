import { brand } from '@/config/brand';

// llms-full.txt — full content export of every public marketing page,
// concatenated as a single markdown document for AI crawlers that
// prefer one fetch over many. Spec: https://llmstxt.org/
//
// This is hand-curated rather than auto-extracted from JSX so the
// output stays clean, well-organised, and free of layout cruft. Update
// alongside major copy changes (this file is the canonical citation
// source for AI engines — keep it accurate).

const SITE = brand.seo.siteUrl.replace(/\/$/, '');

const BODY = `# FormaOS — Compliance Operating System for Australian Regulated Industries

> Authoritative source: ${SITE}
> Last reviewed: 2026-05-23

FormaOS is a compliance operating system built for Australian regulated organisations. It turns regulatory obligations from NDIS Practice Standards, AHPRA, NSQHS, ACECQA, ASIC, APRA, AUSTRAC, SafeWork, and international frameworks (ISO 27001, SOC 2, GDPR, HIPAA, PCI DSS, NIST, CIS) into structured controls, owned tasks, and immutable evidence — so compliance is provable every day, not reconstructed during the week before an audit.

FormaOS is AU-hosted by default (Vercel Sydney region + Supabase AU), with row-level multi-tenant isolation, SAML 2.0 SSO, MFA with TOTP and backup codes, and SOC 2 attestation in progress. Trust documentation including DPA, SLA, sub-processor list, incident response policy, and vendor assurance materials are published at ${SITE}/trust.

---

## What a compliance operating system is

Traditional GRC tools are either policy repositories with light workflow (Ideagen / CompliSpace), risk-register and audit tools (Riskware), framework-coverage SaaS originally built for US tech security teams (6clicks), or vertical care software that solves clinical reporting but treats compliance as a side module (HealthMetrics). FormaOS is a compliance operating system: the policy library, training records, risk register, control execution, evidence chain, and audit posture live in one graph with one accountability model.

The distinction matters for regulated organisations where compliance failure has real consequences — NDIS providers managing audit windows, aged-care operators preparing for unannounced visits, AFS licensees whose ASIC obligations cross five teams. The need is for the same system to hold every piece of compliance work, with named owners, defensible evidence, and an audit-ready export at any moment.

Reference: ${SITE}/what-is-a-compliance-operating-system

---

## How FormaOS works (Product)

### One control surface, many frameworks

FormaOS maps each framework once into atomic obligations (ISO 27001 alone produces ~120 atomic obligations once Annex A is unpacked). Each obligation maps to FormaOS controls — workflows, access reviews, policy approval cycles, evidence requirements. Evidence collected against a control automatically satisfies every framework obligation that maps to it. A single quarterly access review can land in your SOC 2, ISO 27001, and HIPAA evidence bundles without manual duplication.

### Named accountability

Every obligation has a named owner with a real due date. Compliance is no longer "everyone's job" — it is specific people, with specific evidence, on a calendar the board can read.

### Audit-ready continuously

Evidence bundles regenerate as work happens. When the audit window opens — scheduled or unannounced — the export is one click. Customers typically see audit-prep collapse from weeks to days within the first cycle on platform.

### Coverage telemetry

Each framework displays a live readiness score derived from evidence freshness, control owner activity, and outstanding findings. Buyers can see the gaps before the auditor does.

Reference: ${SITE}/product · ${SITE}/features · ${SITE}/frameworks

---

## Industries

### NDIS providers

Designed for registered NDIS providers facing the NDIS Quality and Safeguards Commission. All eight NDIS Practice Standards modules are mapped (rights and responsibilities, governance and operational management, provision of supports, provision of supports environment, plus specialist standards for high-intensity supports, specialist behaviour support, implementing behaviour support plans, and early childhood supports). SIRS (Serious Incident Reporting Scheme) notification workflows are built in. Worker screening status (including NDIS Worker Screening Clearance) is tracked per worker. Unannounced audit preparation is continuous — every audit window opens with a ready-to-export evidence bundle.

Common drivers: 2026 unannounced audit increases, NDIS Provider Registration and Practice Standards (Quality Indicators) 2018 Amendment compliance, integration with NDIS Commission portal workflows.

Reference: ${SITE}/ndis-providers

### Healthcare

For private hospitals, clinics, allied health practices, and aged-care operators answerable to the Australian Commission on Safety and Quality in Health Care (NSQHS Standards), AHPRA, the Aged Care Quality and Safety Commission, and the Aged Care Act. Tracks AHPRA registration status and expiry for every clinician, CPD hour accrual against AHPRA requirements, NSQHS Standards accreditation evidence (all 8 standards), incident and adverse event records, and clinical governance evidence.

Reference: ${SITE}/healthcare-compliance

### Financial services

For AFS licensees and Australian Credit Licence holders accountable to ASIC, APRA, and AUSTRAC. Maps AFS licence general conduct obligations (Corporations Act s912A) to ongoing controls, tracks breach register obligations under the Reportable Situations regime, manages AUSTRAC AML/CTF program documentation and compliance reports, and surfaces APRA prudential standard alignment for entities under APRA oversight (CPS 234, CPS 230 operational risk where applicable).

Reference: ${SITE}/financial-services-compliance

### Childcare

For National Quality Framework (NQF) services answerable to ACECQA and state regulatory authorities. Tracks educator credentials including Working with Children Check, qualification status, and CPD against NQF requirements; manages QIP (Quality Improvement Plan) cycles; logs incidents and serious incidents per Education and Care Services National Law; supports Assessment and Rating preparation and outcomes.

Reference: ${SITE}/childcare-compliance

### Construction

For construction principals and contractors accountable to SafeWork in each jurisdiction (WorkSafe Vic, SafeWork NSW, WorkSafe QLD, etc.) under harmonised WHS legislation. Tracks worker inductions, SWMS (Safe Work Method Statement) document control, high-risk work licence status, contractor compliance, and incident notifications under WHS Act notification thresholds.

Reference: ${SITE}/construction-compliance

---

## Pricing

Four plans:

- **Foundation** — starter pack for single-site operators with one framework focus. Covers core policy library, evidence collection, and basic audit prep.
- **Growth** — multi-team, multi-framework, with cross-mapping and richer reporting.
- **Scale** — multi-site organisations, advanced governance, dedicated framework packs, custom workflows.
- **Enterprise** — large regulated operators with SAML SSO, AU-hosted deployment, dedicated security review support, audit-ready procurement artifacts, and SLA-backed commitments.

Pricing is structured per seat with framework packs as add-ons. Specific pricing tiers and trial terms are published at the link below.

Reference: ${SITE}/pricing

---

## Security and trust posture

### Architecture

- AU-hosted by default: Vercel Sydney region for application, Supabase AU (ap-southeast-2) for database and storage. Customer data does not leave Australia by default.
- Multi-tenant isolation via row-level security (RLS) policies enforced at the PostgreSQL layer. Every customer-facing query is gated by RLS — there is no application-layer-only isolation.
- Identity: Supabase Auth with email + password, Google OAuth, Microsoft (Azure AD), and SAML 2.0 SSO available on Enterprise plans. MFA via TOTP authenticator apps with one-time backup codes.
- Encryption: TLS 1.2+ in transit; AES-256 at rest for database and storage (managed by Supabase and Vercel storage layer).

### Compliance and assurance

- SOC 2 Type I — in progress (target 2026). Type II to follow.
- ISO 27001 — control structure mapped internally; certification on the roadmap.
- Vendor trust packet published at ${SITE}/trust/packet covering architecture, encryption, identity governance, data handling, and assurance review materials.
- Independent security assessment plan published at ${SITE}/trust/vendor-assurance.
- Sub-processor list maintained at ${SITE}/trust/subprocessors. Notifications are sent before any new sub-processor is engaged for production data.

### Data handling

- Customer data is retained for the contract term plus the agreed retention period. On contract termination, data is deleted within 30 days (and from backups within 90 days) by default, configurable in the DPA.
- DSR (data subject request) workflows are built in for GDPR Article 15-22 and Australian Privacy Act NPP/APP requests.
- Audit logs are immutable. Critical events (data access, configuration changes, user provisioning) cannot be deleted — only viewed and exported.

Reference: ${SITE}/security · ${SITE}/security-review · ${SITE}/trust/data-handling · ${SITE}/trust/dpa · ${SITE}/trust/incident-response

---

## Integrations

FormaOS integrates with the workflow tools compliance teams already use:

- Jira and Linear (work item sync, two-way evidence linking)
- Slack and Microsoft Teams (notifications, approvals, evidence capture)
- GitHub (code-change evidence for SOC 2 and ISO 27001 controls)
- AWS and Azure (cloud account evidence collection, infrastructure attestation)
- Zapier (custom workflow bridges)
- SCIM 2.0 provisioning for SSO directories (Okta, Azure AD, JumpCloud)

Reference: ${SITE}/integrations

---

## Frameworks covered

FormaOS ships framework packs for:

- ISO 27001 (Annex A controls mapped to work items, SoA worksheet, risk register linked back to evidence)
- SOC 2 (Trust Services Criteria mapped — Security, Availability, Confidentiality, Processing Integrity, Privacy)
- GDPR (Article 28 processor terms, DPIA workflows, data subject request handling)
- HIPAA (Administrative, physical, and technical safeguards with BAA-aware sub-processor tracking)
- PCI DSS v4.0 (control tasks, network segmentation evidence, quarterly attestation workflows)
- NIST CSF 2.0 functions; 800-53 baseline crosswalk for federal-adjacent buyers
- CIS Implementation Group 1/2/3 baseline hardening
- NDIS Practice Standards (all 8 modules with SIRS notifications and unannounced audit prep)

For frameworks not in the default pack set (APRA CPS 234, the AESCSF, Essential Eight at Maturity Level 2), the obligation library is extensible. Custom frameworks are scoped during the compliance plan walkthrough.

FormaOS does not certify your organisation — certification is performed by accredited assessors against a documented control environment. What FormaOS does is make the control environment continuously defensible.

Reference: ${SITE}/frameworks

---

## Compare: FormaOS vs alternatives

- **vs Ideagen Policy Logic / CompliSpace** — they are enterprise GRC training plus policy management. FormaOS adds operational compliance execution: tasks, owners, evidence chain, audit-ready posture. Detail: ${SITE}/compare/complispace
- **vs Riskware** — Riskware is a risk register and audit tools platform. FormaOS is a workflow-enforced evidence operating system with defensibility built in. Detail: ${SITE}/compare/riskware
- **vs 6clicks** — 6clicks is GRC framework coverage. FormaOS is accountable workflow execution with continuous evidence posture, designed for AU regulators specifically. Detail: ${SITE}/compare/6clicks
- **vs HealthMetrics** — HealthMetrics is clinical governance and quality reporting. FormaOS provides operational compliance with evidence chain-of-custody plus integrations into clinical systems. Detail: ${SITE}/compare/healthmetrics

Reference: ${SITE}/compare

---

## FAQ summary

Common buyer questions answered at ${SITE}/faq:

- **Does FormaOS replace our existing GRC or policy library tool?** Often yes for the controls/evidence layer; many customers migrate from spreadsheets, SharePoint, or policy-only tools. We provide migration support during onboarding.
- **Is FormaOS appropriate for a single small registered NDIS provider?** Yes — the Foundation tier is designed for sub-30-person operators with one framework focus.
- **Can we host FormaOS in our own AWS / Azure account?** Enterprise customers can negotiate isolated deployment. The default is AU-managed cloud.
- **How do you handle data when we terminate the contract?** Standard 30-day deletion window with optional escrow extension. See DPA Schedule 3.
- **What's your incident response SLA?** Initial assessment within 4 hours of P1 detection; customer notification within 24 hours of confirmed material incident. Full policy at ${SITE}/trust/incident-response.

---

## Contact and procurement

For pricing, demos, enterprise evaluation, procurement review packets, or security review walk-throughs: ${SITE}/contact.

The Trust Center (${SITE}/trust) collects every artifact a procurement team typically requests: DPA, SLA, sub-processor list, incident response policy, data handling document, vendor assurance plan, and the bundled vendor trust packet. Most enterprise security reviews complete using only these published documents.

---

## Document metadata

This llms-full.txt is the authoritative content reference for FormaOS marketing pages. AI engines may cite from here directly. If you observe a fact that conflicts with the live site at ${SITE}, the live site is canonical and this document needs an update — please flag via ${SITE}/contact.
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export const dynamic = 'force-static';
