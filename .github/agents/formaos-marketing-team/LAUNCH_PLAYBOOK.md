# FormaOS Marketing Swarm Launch Playbook

This file turns the marketing-swarm prompt pack into runnable Codex sub-agent launch payloads.

These payloads are written for Codex multi-agent sessions using `spawn_agent`, `send_input`, and `wait_agent`.

## How To Use

1. Set the current objective and page scope.
2. Launch the three-core lead agents first.
3. Launch the page specialists that match the task.
4. Always include Agent 09 for content truth and Agent 10 for validation when shipping real changes.
5. Wait on the agents you are blocked on. Let the rest run in parallel.

## Shared Objective Template

Use this text as the `CURRENT_OBJECTIVE` placeholder in the launch payloads:

```text
Current objective: <replace with the exact marketing goal>.
Page scope: <replace with exact routes or page cluster>.
Definition of done: ship production-safe improvements that strengthen the full FormaOS website system without breaking shared styling, routing, accessibility, telemetry, or brand credibility.
```

## Shared Boot Block

Prepend this to every spawned agent message:

```text
Work in /Users/ejaz/FormaOS.
Read and follow these files before acting:
- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md
- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/<ROLE_FILE>
- /Users/ejaz/.codex/skills/formaos-master/SKILL.md
- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md
- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md

You are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes. Prefer shared-system fixes over page hacks. Keep claims aligned with implemented product capabilities.

Return:
1. concise plan
2. files you will touch
3. changes made
4. validation run
5. unresolved risks or handoffs
```

## Full Swarm Launch Order

### Agent 01

```text
spawn_agent({
  "agent_type": "default",
  "task_name": "marketing_creative_director",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/01-creative-director-orchestrator.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes. Prefer shared-system fixes over page hacks. Keep claims aligned with implemented product capabilities.\n\nCURRENT_OBJECTIVE\n\nStart by defining the site-wide visual thesis, narrative thesis, conversion thesis, priority order, and acceptance bar. Then coordinate the other agents through crisp ownership guidance."
})
```

### Agent 02

```text
spawn_agent({
  "agent_type": "worker",
  "task_name": "marketing_design_systems",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/02-design-systems-architect.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: shared marketing design system, shells, tokens, reusable primitives.\nPrimary files: app/(marketing)/design-system.css, app/(marketing)/marketing.css, app/(marketing)/layout.tsx, app/(marketing)/components/shared/*, components/marketing shared primitives, components/motion shared primitives.\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 03

```text
spawn_agent({
  "agent_type": "worker",
  "task_name": "marketing_frontend_architect",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/03-marketing-frontend-architect.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: route architecture, composition, deferred-loading patterns, shared structure, telemetry-safe refactors.\nPrimary files: app/(marketing) route trees, shared page content composition, lib/marketing wiring touched by marketing routes.\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 04

```text
spawn_agent({
  "agent_type": "worker",
  "task_name": "marketing_homepage_story",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/04-homepage-storytelling-engineer.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: homepage and homepage-specific sections only.\nPrimary files: app/(marketing)/page.tsx, app/(marketing)/components/HomePageContent.tsx, app/(marketing)/components/homepage/*.\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 05

```text
spawn_agent({
  "agent_type": "worker",
  "task_name": "marketing_product_demo",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/05-product-demo-experience-engineer.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: product, features, operate, govern, prove, evaluate, shared product-demo sections.\nPrimary files: app/(marketing)/product/*, app/(marketing)/features/*, app/(marketing)/operate/*, app/(marketing)/govern/*, app/(marketing)/prove/*, app/(marketing)/evaluate/*, components/marketing/demo/*.\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 06

```text
spawn_agent({
  "agent_type": "worker",
  "task_name": "marketing_growth_pricing",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/06-growth-pricing-conversion-engineer.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: pricing, contact, CTA pathways, conversion-supporting sections.\nPrimary files: app/(marketing)/pricing/*, app/(marketing)/contact/*, CTA components and related telemetry wiring for marketing surfaces.\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 07

```text
spawn_agent({
  "agent_type": "worker",
  "task_name": "marketing_trust_enterprise",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/07-trust-enterprise-proof-engineer.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: enterprise, trust, security, security review, legal, status, procurement-proof pages.\nPrimary files: app/(marketing)/enterprise/*, app/(marketing)/enterprise-proof/*, app/(marketing)/trust/*, app/(marketing)/security/*, app/(marketing)/security-review/*, app/(marketing)/legal/*, app/(marketing)/status/*.\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 08

```text
spawn_agent({
  "agent_type": "worker",
  "task_name": "marketing_vertical_narratives",
  "model": "gpt-5.4",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/08-vertical-pages-narrative-engineer.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: industries, frameworks, integrations, use-cases, compare, documentation, blog, FAQ, about, story, roadmap, changelog, SEO landing pages.\nPrimary files: app/(marketing)/industries/*, app/(marketing)/frameworks/*, app/(marketing)/integrations/*, app/(marketing)/use-cases/*, app/(marketing)/compare/*, app/(marketing)/documentation/*, app/(marketing)/blog/*, app/(marketing)/faq/*, app/(marketing)/about/*, app/(marketing)/our-story/*, app/(marketing)/roadmap/*, app/(marketing)/changelog/*, app/(marketing)/what-is-a-compliance-operating-system/*, app/(marketing)/audit-evidence-management/*, app/(marketing)/healthcare-compliance-platform/*, app/(marketing)/soc2-compliance-automation/*, app/(marketing)/ndis-compliance-system/*, app/(marketing)/iso-compliance-software/*.\nYou are not alone in the codebase. Do not revert work by other agents. Adjust to existing changes.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 09

```text
spawn_agent({
  "agent_type": "explorer",
  "task_name": "marketing_seo_content",
  "model": "gpt-5.4-mini",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/09-seo-content-systems-engineer.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/frontend-skill/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: metadata, schema, internal links, copy truth, content-quality audit across all touched marketing pages.\nDo not make speculative product claims. If you edit, keep edits tightly scoped to content and metadata files.\n\nCURRENT_OBJECTIVE"
})
```

### Agent 10

```text
spawn_agent({
  "agent_type": "explorer",
  "task_name": "marketing_qa_validation",
  "model": "gpt-5.4-mini",
  "reasoning_effort": "high",
  "message": "Work in /Users/ejaz/FormaOS.\nRead and follow these files before acting:\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/SHARED_OPERATING_CONTRACT.md\n- /Users/ejaz/FormaOS/.github/agents/formaos-marketing-team/10-qa-accessibility-performance-engineer.agent.md\n- /Users/ejaz/.codex/skills/formaos-master/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-testing/SKILL.md\n- /Users/ejaz/.codex/skills/formaos-delivery/SKILL.md\n\nOwnership: QA strategy, accessibility, route integrity, CTA verification, telemetry checks, performance risk review across touched pages. Run only validation that matches the changed scope.\n\nCURRENT_OBJECTIVE"
})
```

## Recommended Wait Pattern

Use waits sparingly. A good pattern is:

```text
wait_agent({
  "targets": [
    "marketing_creative_director",
    "marketing_design_systems",
    "marketing_frontend_architect"
  ],
  "timeout_ms": 120000
})
```

Then wait on the relevant page specialists only when the next integration step depends on them.

## Send-Input Patterns

### Push a narrowed objective to the whole swarm

```text
send_input({
  "target": "marketing_creative_director",
  "message": "Narrow the active scope to homepage plus pricing. Keep all recommendations compatible with the rest of the website."
})
```

### Redirect a specialist immediately

```text
send_input({
  "target": "marketing_growth_pricing",
  "interrupt": true,
  "message": "Focus only on /pricing and /contact. Do not change shared primitives unless Agent 02 requests it."
})
```

### Ask QA for a final pass

```text
send_input({
  "target": "marketing_qa_validation",
  "message": "Run a final regression-minded review of the touched marketing surfaces and report highest-risk issues first."
})
```

## Safe Launch Profiles

### Full Swarm

Use all 10 agents when changing multiple flagship pages or the whole marketing system.

### Core Trio

Launch Agents 01, 02, and 03 when the task is still being framed and you want system direction before page execution.

### Flagship Page Pod

Launch Agents 01, 02, 03, one relevant specialist from 04 to 08, plus 09 and 10.

### Content-Only Pod

Launch Agents 01, 08, 09, and 10 when the task is mostly copy, metadata, or SEO structure.

## First Ready-To-Run Objective Example

Replace `CURRENT_OBJECTIVE` with:

```text
Current objective: upgrade the FormaOS marketing system so homepage, product, pricing, enterprise, and trust feel like one premium, high-conviction website for regulated buyers.
Page scope: /, /product, /pricing, /enterprise, /trust.
Definition of done: ship production-safe improvements that strengthen hierarchy, design coherence, proof quality, CTA clarity, and trust without breaking accessibility, performance, telemetry, or route integrity.
```
