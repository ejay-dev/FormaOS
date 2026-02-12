# Pricing Confidence (Per Tier) | What Must Ship For $899+

This is a commercialization readiness assessment for **$249 / $499 / $899+** pricing, with a focus on proof, procurement gates, and trust.

---

## 1) Pricing Confidence Score (0–10)

Scores reflect: (a) buyer willingness to pay, (b) procurement friction, (c) claim defensibility, (d) required proof available at time of sale.

### Tier: $249 / month

**Confidence:** **7.5 / 10**

Why:
- ROI math is easy to defend at this level with modest time savings (~5 hours/week).
- Low procurement friction for many small providers.

What increases confidence:
- 2-3 quantified case studies (hours saved per month, audit prep compression).

### Tier: $499 / month

**Confidence:** **7.4 / 10**

Why:
- Mid-market buyers will ask harder questions (security review, governance, proof artifacts).
- Value is still easily justified if you can prove 100+ hours/month saved.

What increases confidence:
- Repeatable “14-day proof packet” delivered in pilots (now productized via governance exports).
- Standardized trust packet + procurement FAQ that avoids over-claims (now shipped).

### Tier: $899+ / month

**Confidence:** **7.5 / 10** (post-upgrades as of 12 Feb 2026)  
**Target confidence:** **8.2 / 10** (after remaining assurance + reference proof)

Why:
- $899+ buyers require enterprise identity, vendor assurance signals, and contractual readiness.
- They also expect packaged outcomes: onboarding, governance cadence, and named references.

---

## 2) What Must Be Shipped To Confidently Charge $899+

This is not a “feature wish list”. These are **enterprise purchase gates**.

### A) Vendor Assurance (Trust Signal)

Remaining (not yet shipped):
- SOC 2 Type II report for FormaOS as a vendor, or
- an independent security assessment/pen test summary + a documented security program, delivered as a standard artifact

### B) Enterprise Identity

Shipped:
- SAML SSO (Okta/Azure AD) for enterprise plans (org-scoped metadata + ACS + assertion validation + enforce toggle)

Next:
- SCIM provisioning (or a documented workaround with admin controls) for customers with strict JML requirements

### C) Procurement Readiness Artifacts

Shipped:
- Trust Center pages + Security Review + 25-question procurement FAQ
- Subprocessor list page + template
- Incident response and escalation summary page
- SLA tier breakdown page + basic public status page
- Downloadable Vendor Trust Packet PDF (auto-generated)

### D) Packaged Outcomes (Why $899 is “worth it”)

Shipped:
- 14-day proof packet generator (zip export)
- monthly executive compliance pack export
- audit-ready export bundle (zip export)
- governance export dashboard view for admins

Remaining:
- A documented onboarding + evidence migration plan template (services motion) for enterprise procurement packages

### E) Proof (Measured Outcomes)

Remaining (commercial, not product):
- 3-5 named customer references (or at minimum, reference calls available under NDA)
- quantified outcomes (audit prep hours saved; time-to-procurement approval; reduction in expired credentials; incident closure times)

---

## 3) Claims To Remove / Qualify Immediately (Trust Protection)

These items slow procurement and can create legal/credibility risk if not precisely worded.

### Must remove or rename (over-claim risk)

- **“Threat correlation engine”**: if the capability is request correlation/tracing, call it that.
- **“AI evidence scoring / AI intelligence”**: if scoring is rule-based, remove “AI” language.
- **“6 roles”**: if the system uses 4 roles, correct the claim everywhere.

### Must qualify (alignment vs certification)

- Any wording that could be read as **“SOC 2 Type II certified”** for FormaOS as a vendor.
- Any wording that could be read as **“ISO 27001 certified”** for FormaOS as a vendor.
- Use “SOC 2-aligned / ISO 27001-aligned” and explicitly clarify certification status.

### Must avoid unless implemented

- HRIS/CRM integrations, sandbox environments, SCIM
- “End-to-end encryption” (unless you mean infrastructure encryption, which must be stated clearly)

### Must be contract-accurate

- Data deletion timelines and “deletion certificates”
- Incident notification timing (avoid absolute promises without contract language)
- SLA guarantees (avoid stating as universal if only enterprise plans include them)
