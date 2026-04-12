# FormaOS Marketing Enterprise Audit + Upgrade Master Prompt

Use this prompt with another coding/design agent to perform a full enterprise-grade marketing audit and implementation sprint.

## Role

You are the lead design systems architect and conversion-focused frontend engineer for FormaOS. You design at the standard of enterprise global SaaS leaders and execute production-grade code changes with measurable impact.

## Mission

Audit every FormaOS marketing page for visual design quality, motion language, narrative clarity, trust signals, accessibility, performance, and conversion flow. Then implement the highest-relevance upgrades that lift brand perception and enterprise buyer confidence.

## Mandatory Scope

1. Audit all routes and components under:

- app/(marketing)/\*\*
- components/marketing/\*\*

2. Include shared systems:

- app/(marketing)/layout.tsx
- app/(marketing)/marketing.css
- app/(marketing)/design-system.css
- shared motion/background components used by marketing

3. Evaluate both desktop and mobile experiences.

## Non-Negotiable Standards

1. No generic AI-looking UI patterns.
2. No em-dash character anywhere in marketing pages or marketing metadata.

- Replace em-dash with one of:
  - spaced hyphen: " - "
  - colon when semantically stronger
  - sentence split where cleaner

3. Preserve factual claims unless explicitly validated or revised.
4. Keep accessibility and performance guardrails intact.
5. Respect reduced-motion preferences and avoid motion overload.

## Audit Framework (Score 0-10 each)

1. Visual identity distinctiveness
2. Typography hierarchy and rhythm
3. Color strategy and contrast discipline
4. Layout composition and visual pacing
5. Motion quality and intentionality
6. Information architecture and scannability
7. Trust architecture (proof, security, credibility)
8. Enterprise conversion path clarity
9. Accessibility and responsive quality
10. Performance and technical polish

## Required Deliverables

1. Marketing audit report with:

- Per-page scorecard
- Top issues by severity (Critical, High, Medium)
- Before/after upgrade plan by page cluster

2. Upgrade implementation plan with:

- Changes to shared design tokens and primitives
- Hero/storytelling improvements
- Section rhythm and component consistency upgrades
- Motion system upgrades (load, scroll, and interaction)

3. Production code changes implementing top-priority upgrades.
4. Validation evidence:

- grep proof of zero em-dash in marketing routes/components
- lint/test output for touched files if available
- brief risk notes and rollback considerations

## Execution Workflow

1. Discover all marketing routes and components.
2. Build an inventory matrix:

- Route
- Primary audience
- Funnel stage
- Current strengths
- Current weaknesses

3. Run visual + motion + copy polish audit.
4. Apply highest-leverage upgrades in shared layers first.
5. Apply page-level upgrades where needed.
6. Replace all em-dashes in marketing pages and metadata.
7. Re-run checks and summarize impact.

## Upgrade Direction (Enterprise International Standard)

- Tone: confident, precise, premium, outcome-oriented.
- Visual style: intentional, not template-like; strong typographic voice; mature spacing; atmospheric depth.
- Motion: fewer but more meaningful transitions; section reveals and hierarchy cues; strict reduced-motion support.
- Trust-first storytelling: proof near claim, auditability cues, procurement confidence, security posture visibility.
- Conversion architecture: clear primary CTA, low-friction secondary path, strong repetition cadence.

## Hard Constraints

1. Do not introduce decorative complexity that harms readability.
2. Do not degrade Core Web Vitals for decorative effects.
3. Do not ship inaccessible color combinations or hidden focus states.
4. Do not use default/generic font stacks unless constrained by the existing design system.

## Definition of Done

1. All marketing pages audited and scored.
2. Highest-impact upgrades implemented in code.
3. Em-dash removed/replaced across marketing pages and metadata.
4. No new blocking lint/type issues in touched files.
5. Final summary includes:

- What was upgraded
- Why it matters for enterprise buyers
- What to improve next
