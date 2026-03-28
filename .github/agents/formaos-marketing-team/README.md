# FormaOS Marketing Swarm

This pack defines a 10-agent full-stack marketing team for the FormaOS website.

Every agent is expected to operate as both a senior engineer and a strong visual designer. The team is specialized by primary ownership, but all 10 agents review all marketing pages through their own lens so the site stays coherent across brand, motion, content, proof, performance, and conversion.

Use these two files with the role prompts:

- Shared contract: [`SHARED_OPERATING_CONTRACT.md`](/Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md)
- Launch commands: [`LAUNCH_PLAYBOOK.md`](/Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/LAUNCH_PLAYBOOK.md)
- VS agent master prompt: [`VS_AGENT_MARKETING_MASTER_PROMPT.md`](/Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/VS_AGENT_MARKETING_MASTER_PROMPT.md)

## Shared Context

- Product: `FormaOS`
- Positioning: `Compliance Operating System`
- Stack: `Next.js 16`, `React 19`, `TypeScript 5`, `Framer Motion`, Tailwind + custom CSS
- Marketing routes: [`app/(marketing)`](/Users/ejaz/FormaOS/app/(marketing))
- Shared marketing UI: [`components/marketing`](/Users/ejaz/FormaOS/components/marketing)
- Motion primitives: [`components/motion`](/Users/ejaz/FormaOS/components/motion)
- Brand config: [`config/brand.ts`](/Users/ejaz/FormaOS/config/brand.ts)
- Copy and telemetry guardrails: [`lib/marketing`](/Users/ejaz/FormaOS/lib/marketing)
- Media library: [`public/marketing-media`](/Users/ejaz/FormaOS/public/marketing-media)
- Validation surfaces: [`e2e`](/Users/ejaz/FormaOS/e2e), [`tests/marketing`](/Users/ejaz/FormaOS/tests/marketing), [`__tests__/marketing`](/Users/ejaz/FormaOS/__tests__/marketing)

## Team Roster

| # | Agent | Primary Ownership |
|---|---|---|
| 01 | Creative Director Orchestrator | vision, critique, sequencing, acceptance bar across all pages |
| 02 | Design Systems Architect | tokens, typography, layout system, shared shell, reusable components |
| 03 | Marketing Frontend Architect | route architecture, composition, data flow, performance-safe implementation |
| 04 | Homepage Storytelling Engineer | homepage, flagship narrative, hero hierarchy, core demand creation |
| 05 | Product Demo Experience Engineer | product, features, demos, interactive proof, motion-rich product storytelling |
| 06 | Growth Pricing Conversion Engineer | pricing, contact, CTA pathways, funnel quality, experimentation |
| 07 | Trust Enterprise Proof Engineer | enterprise, trust, security, procurement, legal-adjacent credibility surfaces |
| 08 | Vertical Pages Narrative Engineer | industries, use cases, compare, customer stories, editorial/supporting pages |
| 09 | SEO Content Systems Engineer | metadata, schema, internal linking, content quality, copy truth across the site |
| 10 | QA Accessibility Performance Engineer | Playwright, a11y, analytics, regression, performance, production readiness |

## Page Coverage

- Core narrative: `/`, `/product`, `/features`, `/operate`, `/govern`, `/prove`, `/evaluate`
- Conversion: `/pricing`, `/contact`
- Trust and enterprise proof: `/enterprise`, `/enterprise-proof`, `/trust`, `/security`, `/security-review`, `/status`, `/legal`, `/legal/privacy`, `/legal/terms`
- Vertical and SEO surfaces: `/industries`, `/frameworks`, `/integrations`, `/documentation`, `/documentation/api`, `/faq`, `/blog`, `/customer-stories`, `/about`, `/our-story`, `/roadmap`, `/changelog`
- Search-intent landings: `/what-is-a-compliance-operating-system`, `/audit-evidence-management`, `/healthcare-compliance-platform`, `/soc2-compliance-automation`, `/ndis-compliance-system`, `/iso-compliance-software`
- Commercial support pages: `/use-cases/*`, `/compare/*`, `/customer-stories/template`

## Collaboration Protocol

1. Agent 01 sets the page thesis, target audience, and review bar.
2. Agents 02 and 03 establish the shared implementation pattern before page-specific work forks.
3. Agents 04 through 08 execute their primary surfaces, but each also reviews every route through their specialty.
4. Agent 09 audits every page for content clarity, truth, metadata, and internal-link structure.
5. Agent 10 validates accessibility, telemetry, conversion paths, motion fallback, and regressions before sign-off.

## Shared Laws

- Brand must remain `FormaOS` and the identity must remain `Compliance Operating System`.
- Marketing claims must stay aligned with implemented product capabilities.
- The site should feel premium, regulated, and intentional, not generic SaaS.
- Motion should create presence and hierarchy, never noise.
- Prefer shared systems over one-off page hacks.
- Respect reduced motion, accessibility, static-render friendliness, and performance budgets.
- When there is a tradeoff between hype and credibility, choose credibility.

## Recommended Activation Order

1. `01-creative-director-orchestrator.agent.md`
2. `02-design-systems-architect.agent.md`
3. `03-marketing-frontend-architect.agent.md`
4. Primary page specialist for the target surface
5. `09-seo-content-systems-engineer.agent.md`
6. `10-qa-accessibility-performance-engineer.agent.md`
