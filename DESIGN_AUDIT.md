# FormaOS Marketing Website — Visual & Motion Design Audit

> **Scope:** Marketing website only — Home, Product, Trust, Security, Industries, Pricing, Outcomes, Blog, Docs, all hero sections, all animated/3D components, Navbar, Footer, Buttons, Cards, Tabs, Backgrounds, Glow/Particle effects, Scroll behaviors, Micro-interactions.
> **Not in scope:** SEO, backend, auth, performance logic.
> **Date:** February 2026

---

## 1. Brutal Visual Quality Assessment

Each dimension rated 1–10 with honest reasoning.

---

### Hero Impact — **6 / 10**

The home hero is technically assembled. It has a large viewport-filling layout, a gradient headline, floating metric cards, parallax scroll exit, WebGL particles, and canvas constellation dots. On paper that is a lot. In practice it reads as busy rather than powerful. The headline — *"Operational Compliance, Built for Real Organizations"* — is generic enterprise boilerplate. The floating cards on the left and right columns use labels like "Real-time", "Automated", "Faster", and "Always-on" with no numbers behind them. They feel like placeholders that were never filled in. The cyan badge chip with "Enterprise Compliance OS" offers no drama. There is nothing in the first viewport that creates a moment of genuine awe.

Sub-page heroes are worse. Product, Pricing, Industries, and Security are all generated from an identical visual template: one radial gradient orb top-center, one bottom-left, a centered badge+headline+underline+pills+CTAs stack. Only the icon and text swap. A visitor who navigates from Product to Security to Pricing will register — consciously or not — that they are looking at the same page.

---

### Premium Feel — **5 / 10**

The dark navy palette, cyan accent, and glass morphism suggest a premium direction. But the execution signals mid-tier. Evidence:

- Every card uses the same `from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20` recipe. It is applied to hero metric cards, scroll story steps, capabilities grid, footer CTA — everywhere. When a single pattern covers everything, nothing feels special.
- The dot grid at 7% opacity and the film grain at 2% are barely visible. They exist in code but contribute almost nothing perceptually.
- The "All systems operational" pulsing dot in the footer is a nice detail. The four animated orbs also floating in the footer (two inside FooterCTA plus two in the main footer body, all on infinite loops) dilute it.
- Typography has no moments of real scale drama. Hero is max `text-7xl`. Category-leader sites regularly break 10xl on headlines or use display/editorial type that commands space.

---

### Visual Hierarchy — **6 / 10**

The baseline hierarchy is readable: badge → headline → subtext → CTA → proof strip. That structure exists on every page and it works. The problem is that every *section* uses the same hierarchy pattern with the same size reduction steps. Nothing is loud enough to stop the eye on its own. The cyan pulse-dot label chips appear in: hero badge, value prop section, scroll story section header, compliance engine section, capabilities grid section, security section, outcome proof section — all identical chips with the same cyan/10 background and border. They become invisible through repetition.

---

### Typography Scale Consistency — **7 / 10**

The scale is internally consistent (7xl → 5xl → 4xl → xl → base → sm → xs) and responsive breakpoints are thoughtfully handled. `font-display` and `font-body` CSS variables are used correctly. However:

- The home hero uses `font-bold` on the headline while sub-page heroes use `font-extrabold`. This inconsistency is small but real.
- Line height rules vary: home hero uses `leading-[1.1]`, sub-page heroes use `leading-[1.05]`, scroll story section uses no explicit override. Not controlled enough for a premium system.
- There is no editorial / display moment anywhere. Every heading is a variation of the same sans-serif weight stack. No size contrast that would make a single headline feel like a poster.

---

### Spacing Rhythm — **7 / 10**

Sections use `mk-section` with consistent padding via CSS class. The `max-w-7xl mx-auto px-6 lg:px-12` container is applied consistently. This is correct. Where rhythm breaks down:

- The hero adds extra bottom padding `pb-32 sm:pb-40 md:pb-52` that creates an awkward gap before the enterprise trust strip.
- The value proposition section has `mb-6` on the body paragraph, `mb-12` on the smaller caption, then jumps into the grid — this inversion of spacing emphasis (larger gap after smaller text) is a minor but consistent mistake.
- The footer CTA block is nested inside the footer with `py-16 lg:py-20` and then the main footer grid starts immediately at `py-12`. These two padding values fight each other at the transition.

---

### Animation Smoothness — **7 / 10**

Framer Motion springs and transitions are correctly configured. The scroll parallax exit on the hero (opacity, scale, y driven by `useTransform`) is well-structured with sensible easing curves. Page transitions exist. The 30fps cap on UnifiedParticles is a responsible choice.

What pulls the score down:

- The WebGL NodeField (`@react-three/fiber`) and the UnifiedParticles canvas and the AmbientParticleLayer are all running simultaneously in the hero. Three concurrent animation loops for the same region is a performance and visual coherence problem.
- The infinite-loop blobs in the footer run 8s, 10s, 15s, 18s cycles simultaneously. These are background decorations, but they generate layout reads on every requestAnimationFrame.
- There is no animation that earns its complexity. The most elaborate piece — the WebGL node field — is a point cloud that slowly drifts. It is not responding to scroll depth, compliance state changes on the page, or any meaningful data input.

---

### 3D Realism / Depth — **3 / 10**

The WebGL NodeField is the only true 3D element. It is 800 randomly placed points in a Three.js canvas using `PointMaterial` with `size={0.05}` and `sizeAttenuation`. The mouse creates a very weak repulsion field. The camera moves microscopically with the mouse. The color changes based on a `ComplianceState` enum.

This is flat CSS pretending to be 3D. There is no mesh. No geometry. No lighting that creates believable depth. No environment map. No shadow. The effect reads as "star field background" not "compliance network visualization." The state enum (model / execute / verify / prove) does not produce any visible visual shift that a user could distinguish. It is decorative noise.

The remaining "3D" on the site is entirely CSS `blur-3xl` gradient orbs. These are 2D elements with a depth illusion created by blur. They are fine as supporting texture but should not be mistaken for actual depth work.

---

### Brand Uniqueness — **4 / 10**

The visual language — dark navy, cyan-to-blue gradient headlines, glass morphism cards, floating metric cards with gradient icon backgrounds, constellation particles, animated gradient underlines on hero text — describes approximately thirty SaaS products launched between 2022 and 2025. Linear, Vercel, Resend, Clerk, Supabase, and Grafana Cloud all occupy this space with more refined executions.

FormaOS has a genuinely differentiated product concept: a compliance OS for regulated industries. The visual language does not match that concept. "Compliance OS" should feel like a control room, not a dev tool. The current aesthetic says "developer infrastructure" not "audit defensibility for regulated healthcare and NDIS organizations." The brand's actual target audience (compliance officers in Australian regulated industries) is unlikely to feel seen by this visual direction.

There are seeds of uniqueness: the wire path SVGs on the Trust page, the four-step compliance lifecycle progression, the "Other tools store documents / FormaOS enforces accountability" contrast card pattern. These are the most specific things on the site. They deserve a stronger visual system built around them.

---

### Interaction Delight — **5 / 10**

Present interactions:
- `whileHover={{ scale: 1.05, boxShadow: '...' }}` on the primary CTA button — good
- `whileHover={{ scale: 1.02, y: -5 }}` on scroll story cards — good
- `whileHover={{ x: 4 }}` on footer links — good, subtle
- `whileHover={{ scale: 1.1, rotate: 5 }}` on step icons — slightly overdone (a compliance OS should not have spinning icons)
- The compliance state badge (`animate={{ rotate: [0, 5, -5, 0] }}` on a DollarSign icon in Pricing hero) — confusing for a finance metric icon

Missing interactions:
- No cursor trail or custom cursor
- No scroll-triggered counter animations on numeric claims
- No hover reveal on cards that surfaces deeper content
- No interactive element that makes the product feel alive in the hero
- No toast / feedback micro-interaction on CTA click

---

### Enterprise Trust Perception — **5 / 10**

The `EnterpriseTrustStrip` component exists and is applied to the marketing surface. The footer has trust badges with icon + text for security controls, encrypted data flows, and audit-ready logs. The Trust page has wire path animations and dedicated modules.

What undermines enterprise trust perception:

- The overall aesthetic signals "startup SaaS" not "regulated-industry infrastructure." Enterprise compliance buyers (risk officers, CCOs, audit teams) expect visual density, precision, and seriousness. The floating pastel gradient orbs and cyan sparkle animations suggest consumer SaaS.
- No certification marks visible (ISO 27001, SOC 2, etc.) with real badge imagery — only text labels.
- No customer logos or identifiable reference clients in the hero or trust strip.
- "Start Free Trial" as the primary CTA on most pages including Security and Trust is a mismatch. Enterprise buyers do not "start free trials" of compliance OS platforms. "Request a security briefing" or "Get audit-ready" would land better.

---

## 2. Motion & 3D Audit

### Is the 3D believable or "flat CSS pretending to be 3D"?

**Flat CSS pretending to be 3D.** The WebGL canvas renders 800 uniformly-sized white-to-cyan dots in a randomized sphere. There is no:
- Geometry or mesh
- Depth cuing (size or opacity falloff by Z distance) — `sizeAttenuation` is enabled but the effect is minimal at the chosen camera FOV of 60 with position z=18
- Lighting simulation beyond a single `ambientLight` at `intensity={0.5}`
- Surface, material, or environmental context
- Any animation that reacts to the page's semantic state (the ComplianceState switch changes the dot color between four hues, but the behavioral change is imperceptible)

The `opacity-20` wrapper on the global WebGL node field in FigmaHomepage renders the entire effect at 20% opacity before it even reaches the eye. This decision makes it even less impactful.

### Are glow effects overused?

**Yes.** Count of active glow/blur decorations on the home page at any scroll position:

1. Hero: `w-[800px] h-[800px]` cyan blob, `w-[700px] h-[700px]` purple blob, center radial gradient
2. Hero: AmbientParticleLayer (canvas-based)
3. Hero: WebGLNodeField at 20% opacity
4. Hero: UnifiedParticles constellation at 50% opacity
5. Global: MarketingBackgroundLayer radial bloom
6. Global: MarketingBackgroundLayer vignette
7. ValueProp section: two animated blobs (cyan and blue, 15s and 18s cycles)
8. ComplianceEngineDemo: `w-[700px] h-[700px]` center radial
9. Footer: two orbs (top-left, bottom-right)
10. Footer CTA: two animated orbs (top-right, bottom-left)

That is ten simultaneous glow layers across the page. At this density, glow stops being an accent and becomes the ambient noise floor. Nothing glows because everything glows.

### Are animations purposeful or decorative?

**Mostly decorative.** The strongest purposeful animations:

- Scroll-driven hero exit (opacity + scale + y transform): purposeful — guides eye downward
- `scrollYProgress`-driven progress bar in ScrollStory: purposeful — narrates completion
- Animated underline `scaleX: 0 → 1` on hero gradient text: purposeful — brief attention anchor
- Footer animated link `x: +4` on hover: purposeful — clear affordance

Decorative animations that add no meaning:
- Infinite blob scaling loops (`scale: [1, 1.1, 1]` over 8–18 seconds)
- Icon rotation in badge chips (`rotate: [0, 5, -5, 0]` on DollarSign and Layers icons)
- WebGL node drift at 20% global opacity
- Footer orb `y: [0, -30, 0]` float animation
- The pulsing pulse-dot `animate-pulse` applied to every section label badge simultaneously

### Is there lag, jank, or blocking interaction?

The 30fps cap on UnifiedParticles is correct. The `requestIdleCallback` delay on heavy visuals is correct. The `force-static` export on marketing layout is correct.

Potential jank sources:
- Three concurrent canvas/WebGL loops in the hero section on desktops
- Multiple `framer-motion` `animate={{ scale: [...], opacity: [...] }}` infinite loops in Footer running regardless of viewport visibility — no `viewport={{ once: false }}` or intersection observer pause
- The footer orbs are outside the viewport on most screen sizes during page load, but they still generate RAF work

### Does motion guide the eye or distract?

**Mixed.** The hero scroll exit is genuinely cinematic. The scroll story progress indicator is directional. The `ScrollReveal` fade-in on section content is invisible in a good way — it just works.

The distractions:
- The floating metric cards flanking the hero on XL screens compete with the headline for first-eye attention. The layout pushes the user's eye to three locations simultaneously (left card cluster, center headline, right card cluster)
- The simultaneous animated blobs in every section create a background pulse that moves independent of content rhythm, pulling attention away from text
- The animated compliance badge chips in every section heading are identical and therefore register as noise after the second repetition

---

### What should be removed

1. **Two of the three hero background layers.** Keep WebGLNodeField at full opacity and remove AmbientParticleLayer and UnifiedParticles from the hero. Three simultaneous canvas-level animations produce visual noise and CPU drain.
2. **Global WebGL node field at 20% opacity in FigmaHomepage.** This fixed-position field is rendered at 20% opacity behind every section. Either use it prominently or remove it. At 20% it is invisible and still burning GPU.
3. **Infinite blob loops in non-hero sections** (ValueProp section, ComplianceEngineDemo section, all footer orbs). Static gradient backgrounds serve the same visual purpose without the animation overhead.
4. **Icon rotation in badge chips.** A compliance OS should not have icons that spin for no reason. Remove `animate={{ rotate: [0, 5, -5, 0] }}` from Layers and DollarSign in Product and Pricing heroes.
5. **Duplicate floating metric cards at XL breakpoint.** The four cards (Real-time, Automated, Faster, Always-on) are vague, competes with the headline, and disappears below 1280px. Either give them real numbers and keep them, or remove them entirely.

---

### What should be upgraded

1. **WebGL NodeField.** Upgrade from a random point cloud to a structured compliance network topology: nodes representing control categories (Policy, Evidence, People, Systems) with animated edges showing data flow. Add depth sorting, fog, and a mild directional light for mesh-level realism.
2. **Hero headline.** The gradient text is good but needs a line-height and scale increase. At 7xl it is not commanding. It should fill the viewport on desktop. Consider `clamp(56px, 8vw, 120px)` to scale with viewport.
3. **Floating metric cards.** Replace qualitative labels with real numbers drawn from real product claims (e.g., "94% first-time audit pass rate", "3 days to audit readiness") with animated counter entrance on first render.
4. **ScrollStory.** The 4-card grid works at the content level. The motion layer is weak. Add a scroll-snapping rail with an active step indicator and a visual canvas change per step (compliance state visualized as the WebGL field transitions through model → execute → verify → prove states).
5. **Page transitions.** `PageTransition` wrapper exists. Use it to create directional slide transitions that reinforce the product's flow concept (left-to-right for forward navigation, right-to-left for back).
6. **Navigation.** The dropdown panels are functional but bare. Add icon + description rows to the Outcomes and Resources dropdowns (similar to Stripe or Vercel megamenu). This increases perceived sophistication and product breadth awareness.

---

### What should be replaced entirely

1. **Sub-page hero template.** The Product / Pricing / Industries / Security hero factory (identical gradient layout, only text swaps) must be replaced with individually authored heroes. Each page serves a different buyer intent and should have a visually distinct entry point.
2. **Background gradient blobs as "depth."** Replace with purposeful layered product visualization. The hero background should show something that communicates what the product does — a compliance graph, a control status dashboard, an evidence chain. Not abstract colored circles.
3. **The `text-gradient` CSS class implementation.** Currently produces a cyan-blue-purple gradient that is identical on every hero. This gradient should be page-specific: warm (amber/orange/red) for Trust, cool (cyan/indigo) for Product, deep (green/teal) for Security, etc.

---

## 3. Major Upgrade Proposals

---

### Proposal 1: Compliance Network Hero Environment (WebGL)

**What changes:** Replace the 800-particle random point cloud with a structured Three.js compliance network. Nodes represent control domains (Policy, Evidence, Risk, People, Systems, Auditor) arranged in a hierarchical ring topology. Edges animate like data-in-flight between nodes. Mouse proximity triggers node illumination. Scroll depth drives network state (sparse → dense → stabilized). The headline and CTA overlay this scene with depth blur.

**Why it elevates brand perception:** This is the only visual on any compliance product that would make a buyer stop and think "this company understands what a compliance OS actually is." It visualizes the product concept, not just the aesthetic category. Competitors (Drata, Vanta, Secureframe) all use abstract gradients.

**Technical approach:** Three.js via `@react-three/fiber`. `InstancedMesh` for nodes (performance). `Line2` from drei for edges. Custom `ShaderMaterial` for node glow using Fresnel. `useSpring` from `@react-spring/three` for state transitions. Target 60fps on hardware GPU, fallback to CSS gradient on `prefers-reduced-motion` and mobile.

**Risk level:** Medium

**Performance impact:** High on low-end devices. Requires power-preference `high-performance`, DPR cap at 1.5, and visibility-based pause. Fallback required for mobile (estimated 40% of traffic).

**Development complexity:** 8–12 days for a production-grade implementation.

---

### Proposal 2: Scroll-Driven Cinematic Storytelling

**What changes:** The existing ScrollStory section is replaced by a full-viewport scroll-driven narrative. As the user scrolls through a pinned section, a single large visualization morphs through the four compliance lifecycle stages. Stage 1 (Structure): a flat org chart assembles from nothing. Stage 2 (Operationalize): tasks and deadlines spawn from each control node. Stage 3 (Validate): a compliance score meter rises in real time. Stage 4 (Defend): an evidence package assembles and "seals" with an animation.

**Why it elevates brand perception:** This is what Stripe uses for their product demos. Linear uses this for feature storytelling. It converts a static feature list into a memorable narrative experience. A compliance officer who watches their workflow animated back at them will remember it. The conversion signal is "this company knows my job."

**Technical approach:** `useScroll` + `useTransform` from Framer Motion driving SVG/Canvas visualization layers. Each "stage" is an SVG scene drawn with `motion.path` `strokeDasharray` technique for draw-on-scroll effect. No WebGL required. Pure CSS/SVG/Framer Motion. Scroll snapping via CSS `scroll-snap-type: y mandatory`.

**Risk level:** Low to Medium

**Performance impact:** Low. SVG and Framer Motion are lightweight. No WebGL GPU requirement.

**Development complexity:** 6–10 days.

---

### Proposal 3: Real-Time Product UI Hero Morph

**What changes:** The hero CTA section transitions from marketing copy into a live preview of the actual FormaOS product UI. On page load: full-width hero headline and CTA. As the user hovers the "Start Free Trial" button, a mock compliance dashboard slides up from the bottom of the viewport in a layered parallax morph — showing a real controls panel, a compliance score gauge, and an evidence status board. The marketing copy scales back. The product fills the remaining hero space.

**Why it elevates brand perception:** This approach (popularized by Loom, Notion, and Linear) eliminates the gap between "what we claim" and "what you see." Compliance buyers are skeptical of vague claims. Showing the actual product in the hero answers objections before they form. It communicates maturity and confidence.

**Technical approach:** CSS transforms + Framer Motion `AnimatePresence` for the slide-up reveal. The "product UI" panel is a styled React component that mirrors real app UI with mocked data. No iframe. No screenshots (too static). A live mock component ensures pixel-perfect quality and updates automatically as the product evolves.

**Risk level:** Low

**Performance impact:** Minimal. The mock product panel is a styled component with CSS animations, no canvas or WebGL.

**Development complexity:** 5–8 days for the initial mock UI panel design + animation logic.

---

### Proposal 4: Interactive 3D Compliance Framework Map

**What changes:** Replace the Capabilities Grid section with an interactive 3D graph that shows how compliance obligations connect to controls, controls to evidence, evidence to frameworks. Users can click/hover nodes to expand detail. A filter rail lets them switch between ISO 27001, SOC 2, HIPAA, NDIS. The graph layout uses a force-directed algorithm (D3-force). The nodes are styled compliance categories with real framework data.

**Why it elevates brand perception:** This is a direct product demonstration that answers the question "does this tool actually support my framework?" before the user clicks through to the docs page. It is the single most effective trust signal for framework-specific compliance buyers. No competitor has a public interactive compliance graph.

**Technical approach:** `d3-force` for layout simulation. Three.js or SVG rendering depending on final node count. `@react-three/fiber` + `@react-three/drei/Html` for mixed 2D label / 3D node approach. Data sourced from existing `framework-packs/` directory in the repo.

**Risk level:** Medium to High

**Performance impact:** Medium. D3-force simulation is CPU-intensive on initial layout. Force simulation should pause when all nodes reach stable positions.

**Development complexity:** 10–15 days for production implementation with real framework data.

---

### Proposal 5: Advanced Shader-Based Background System

**What changes:** Replace all current CSS gradient blobs and decorative glow layers with a single full-page GLSL fragment shader background. The shader responds to scroll position (uniform `u_scroll`), time (uniform `u_time`), and mouse position (uniform `u_mouse`). It produces a deep aurora effect specific to compliance operations: slow-moving vertical data streams in the far background, a horizon glow that shifts between page sections, and a subtle grid of hexagonal cells that pulse on mouse proximity. A single shader replaces 10+ CSS gradient layers.

**Why it elevates brand perception:** Shader backgrounds are the hallmark of top-tier developer tools and category-defining products (Stripe, GitHub Copilot landing page, Vercel). They are genuinely difficult to replicate, which makes the visual language proprietary. The aurora/data-stream aesthetic directly connotes "real-time data flow" which is FormaOS's core value proposition.

**Technical approach:** `@react-three/fiber` with a full-screen quad (`PlaneGeometry`) and custom `ShaderMaterial`. Uniforms passed via React state (`u_scroll` from `useScroll`, `u_mouse` from `usePointer`, `u_time` from `useFrame`). Fallback: static CSS gradient for `prefers-reduced-motion` and mobile.

**Risk level:** High (GLSL authoring is specialized)

**Performance impact:** Medium. A well-optimized fragment shader on a full-screen quad is cheaper than ten CSS `blur-3xl` layers composited by the browser. Requires WebGL2 with graceful fallback.

**Development complexity:** 12–18 days. Requires a GLSL specialist or dedicated design engineer.

---

## 4. Competitive Benchmark Positioning

### Current assessment: **$149–$199 SaaS tier**

Not $49 — the dark theme, motion system, and glass morphism execution are above basic SaaS. Not $299 — the hero impact is not strong enough, the brand uniqueness score is too low, and the 3D layer is not believable. Not $999 enterprise — enterprise buyers perceive trust through density, precision, social proof, and certifications, none of which are prominently present.

The site currently positions in the same tier as early-stage B2B SaaS companies with a design-conscious founding team but no dedicated design system investment. Linear was at this tier in 2020 before their design overhaul. Vercel was at this tier in 2019.

### Gap to category-leader tier

A category-defining Compliance OS at $999/seat enterprise pricing should feel like: **Palantir's intelligence density + Stripe's interaction precision + Linear's aesthetic restraint.**

What separates the current execution from that tier:
1. The aesthetic vocabulary is borrowed (dark SaaS template). It does not own a visual language.
2. There is no "only-FormaOS-could-do-this" visual moment.
3. The product screenshots / UI previews are absent from the marketing site entirely.
4. Enterprise social proof (named customers, auditor endorsements, regulatory citations) is absent from hero and primary section positions.
5. The motion system produces movement everywhere but surprise nowhere.

---

## 5. Clear Recommendation

### If we want to look like a category-defining Compliance OS:

---

#### MUST change immediately

1. **Kill the sub-page hero factory.** Product, Security, Pricing, Industries heroes are identical. Each needs a unique visual entry point authored for its specific buyer intent. This is the single highest-impact change per effort.

2. **Reduce background glow layers from 10 to 3.** One hero ambient layer, one global background layer, one section accent. Remove all infinite-loop blob animations from non-hero sections. Static gradients are sufficient.

3. **Replace vague hero metric cards with real proof claims.** "Real-time" is meaningless. Replace with specific, defensible numbers: compliance score improvement, audit preparation time reduction, framework coverage breadth. If numbers are not available, remove the cards entirely.

4. **Replace "Start Free Trial" as primary CTA on Security and Trust pages.** Enterprise compliance buyers do not trial security platforms. Change to "Request Security Briefing" and "Download Trust Packet." Keep "Start Free Trial" only on Home, Pricing, and Product.

5. **Disable global WebGL node field at 20% opacity in FigmaHomepage.** It is invisible, consumes GPU, and adds no perceivable value.

---

#### Should be phased (Q1–Q2)

1. **Phase 1 (2–3 weeks):** Implement Proposal 3 (Product UI Hero Morph). Lowest risk, highest conversion signal, no WebGL dependency. Ship a live mock compliance dashboard in the hero.

2. **Phase 2 (3–4 weeks):** Implement Proposal 2 (Scroll-Driven Cinematic Storytelling) to replace the existing ScrollStory section. Pure SVG + Framer Motion, no GPU risk.

3. **Phase 3 (4–6 weeks):** Implement Proposal 1 (Compliance Network Hero Environment) with a proper structured node topology, replacing the current random point cloud.

4. **Typography upgrade.** Introduce one editorial/display typeface for hero headlines at scale. The current sans-serif stack is clean but forgettable. A well-selected variable-weight display font used only for H1 would create immediate visual differentiation.

5. **Navigation megamenu.** Upgrade Outcomes and Resources dropdowns to icon + title + one-line description format. This is a 1–2 day change with significant perceived sophistication gain.

---

#### Should be killed

1. **The icon rotation animations on badge chips.** `animate={{ rotate: [0, 5, -5, 0] }}` on a Layers icon and a DollarSign icon is a remnant of consumer SaaS micro-animation thinking. Compliance tools do not wiggle. Remove immediately.

2. **Floating metric cards with qualitative-only labels** (Real-time, Automated, Faster, Always-on). They are not proof. Either give them real numbers or kill them. The current implementation actively undermines trust with buyers who know those words mean nothing.

3. **The "Enterprise Compliance OS" badge in the hero.** Self-labeling as enterprise in a badge chip is the oldest signal that you are not. Show, don't declare. Replace with a real trust signal (a named customer category, a regulatory framework, an auditor quote fragment).

4. **The animated underline `scaleX: 0 → 1`** on gradient hero text across all sub-pages. When the same animation runs on every hero of every page, it has become a template artifact. It is no longer intentional design. Kill it on sub-pages; keep only on home if the hero copy earns it.

5. **`blur-3xl` gradient orbs as background depth in non-hero sections.** These are decorative props borrowed from 2022 SaaS trends. They add no product-specific meaning and their density across every section signals that no intentional background design has been authored for secondary sections.

---

*End of audit.*
