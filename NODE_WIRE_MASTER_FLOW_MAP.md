# Node–Wire Master Flow Map

Scope: FormaOS marketing site, auth/onboarding, app, admin console, and cross-domain routing.

Legend
- Node: page or user state.
- Wire: transition via link, button, redirect, or guard.
- Conditions: auth/role/trial gating in `middleware.ts` and auth callback logic.

## Public Website Nodes (Marketing)

Node: Home (`/`)
- Incoming wires: direct visit; nav/logo link from all marketing pages; OAuth callback redirect guard if `?code=` present.
- Outgoing wires: NavLinks to `/product`, `/industries`, `/security`, `/pricing`, `/about`, `/contact`; HeaderCTA to `/auth/signin`, `/pricing`, `/auth/signup?plan=pro`; footer links to `/pricing`, `/contact`, `/privacy`, `/terms`, `/docs`, `/blog`, `/faq`.
- Conditions: public.

Node: Product (`/product`)
- Incoming wires: NavLinks; homepage CTA blocks; footer.
- Outgoing wires: CTAs to `/auth/signup`, `/contact`.
- Conditions: public.

Node: Industries (`/industries`)
- Incoming wires: NavLinks; homepage CTA blocks; footer.
- Outgoing wires: CTAs to `/auth` (redirects to `/auth/signin`), `/auth/signup`, `/contact`, `/product`.
- Conditions: public.

Node: Security (`/security`)
- Incoming wires: NavLinks; homepage CTA blocks; footer.
- Outgoing wires: CTAs to `/auth/signup`, `/auth`, `/contact`.
- Conditions: public.

Node: Pricing (`/pricing`)
- Incoming wires: NavLinks; HeaderCTA; footer.
- Outgoing wires: CTAs to `/auth/signup` (optionally `?plan=pro`), `/contact`.
- Conditions: public.

Node: Our Story (`/our-story`)
- Incoming wires: About page link; footer.
- Outgoing wires: CTAs to `/auth/signup`, `/contact`.
- Conditions: public.

Node: About (`/about`)
- Incoming wires: NavLinks; footer.
- Outgoing wires: links to `/our-story`, `/product`, `/contact`.
- Conditions: public.

Node: Contact (`/contact`)
- Incoming wires: NavLinks; CTAs across marketing pages; app user menu support link; footer.
- Outgoing wires: `/auth/signup` CTA; email/phone mailto/tel links.
- Conditions: public.

Node: Docs (`/docs`)
- Incoming wires: footer.
- Outgoing wires: internal anchors per section; links to `/contact`, `/faq`.
- Conditions: public.

Node: Blog (`/blog`)
- Incoming wires: footer.
- Outgoing wires: (content-driven).
- Conditions: public.

Node: FAQ (`/faq`)
- Incoming wires: footer; docs page.
- Outgoing wires: `/contact`, `/auth/signup`.
- Conditions: public.

Node: Privacy (`/privacy`, `/legal/privacy`)
- Incoming wires: footer.
- Outgoing wires: `/contact`, mailto/tel.
- Conditions: public.

Node: Terms (`/terms`, `/legal/terms`)
- Incoming wires: footer.
- Outgoing wires: `/contact`, mailto/tel.
- Conditions: public.

## Auth & Onboarding Nodes

Node: Auth Entry (`/auth`)
- Incoming wires: marketing links to `/auth`.
- Outgoing wires: middleware redirects to `/auth/signin`.
- Conditions: public.

Node: Sign In (`/auth/signin`)
- Incoming wires: HeaderCTA login; `/auth` redirect; onboarding redirect for logged-out users; manual entry.
- Outgoing wires: Google OAuth -> `/auth/callback`; email sign-in -> `/app`; link to `/auth/signup`.
- Conditions: public; if user already logged in, middleware redirects to `/onboarding` (if incomplete) or `/app`.

Node: Sign Up (`/auth/signup`)
- Incoming wires: marketing CTAs; `/auth/signin` link.
- Outgoing wires: email/Google signup -> `/auth/callback`; link to `/auth/signin`.
- Conditions: public; logged-in users redirected to `/onboarding` or `/app`.

Node: OAuth Callback (`/auth/callback`)
- Incoming wires: Google OAuth redirect; middleware reroutes `/` with `?code=` to here.
- Outgoing wires: founders -> `/admin/dashboard`; new users -> `/onboarding`; existing users -> `/onboarding` if incomplete; fully onboarded -> `/app`.
- Conditions: requires valid OAuth code; uses Supabase service role.

Node: Sign Out (`/auth/signout`)
- Incoming wires: accept-invite error/mismatch screens.
- Outgoing wires: `/auth/signin` after Supabase sign-out.
- Conditions: public, but acts on existing session if present.

Node: Plan Select (`/auth/plan-select`)
- Incoming wires: plan selection flows.
- Outgoing wires: JSON-driven redirect (defaults to `/app`).
- Conditions: requires session; uses API route.

Node: Onboarding (`/onboarding`)
- Incoming wires: auth callback for new users and incomplete onboarding; middleware redirect for logged-in users on `/auth/*`.
- Outgoing wires: completion -> `/app`.
- Conditions: requires session; onboarding completeness stored in org record.

Node: Unauthorized (`/unauthorized`)
- Incoming wires: middleware redirect for non-founder hitting `/admin/*`.
- Outgoing wires: `/` via page logic.
- Conditions: public.

## App Nodes (Authenticated)

Node: App Entry (`/app`)
- Incoming wires: auth callback; `/auth/signin` success; nav links; command menu/palette.
- Outgoing wires: sidebar nav to `/app/*` sections; topbar menu links; billing enforcement redirects to `/app/billing`.
- Conditions: requires session; role gating in middleware; subscription gating if org subscription inactive.

Node: Employer Dashboard (`/app`)
- Incoming wires: same as App Entry for non-staff roles.
- Outgoing wires: admin navigation to governance/operations/intelligence/system pages.
- Conditions: role != staff/member/viewer.

Node: Employee Dashboard (`/app/staff`)
- Incoming wires: middleware redirect for staff/member/viewer entering other `/app/*` routes.
- Outgoing wires: staff nav to `/app/tasks`, `/app/patients`, `/app/progress-notes`, `/app/vault`.
- Conditions: role = staff/member/viewer.

Node: App Sections
- `/app/policies`, `/app/policies/[id]` (governance)
- `/app/registers`, `/app/registers/training`
- `/app/tasks`
- `/app/people`, `/app/team`, `/app/staff`
- `/app/patients`, `/app/patients/[id]`, `/app/progress-notes`
- `/app/vault`, `/app/evidence`
- `/app/reports`, `/app/audit`, `/app/audit/export/[userId]`
- `/app/workflows`
- `/app/settings`, `/app/settings/email-preferences`, `/app/settings/email-history`
- `/app/billing`, `/app/profile`, `/app/history`
- Incoming wires: sidebar, topbar menu, command menu/palette, in-page links.
- Outgoing wires: in-page links to related app sections (e.g., reports -> billing, patients -> notes/tasks).
- Conditions: requires session; staff roles restricted to staff-allowed prefixes; subscription gating blocks most routes to `/app/billing` when inactive/trial expired.

Node: Accept Invite (`/accept-invite/[token]`)
- Incoming wires: invitation emails link from `/app/app/api/invitations/create`.
- Outgoing wires: `/auth/signin` (if unauthenticated), `/auth/signout` (mismatch/invalid), `/app` (success).
- Conditions: requires valid token; session required to accept.

Node: Submit Form (`/submit/[formId]`)
- Incoming wires: external/public form URLs.
- Outgoing wires: self-reload link to same form.
- Conditions: public (not gated by `/app` middleware).

## Admin Console Nodes (Founder-only)

Node: Admin Entry (`/admin`)
- Incoming wires: auth callback for founders; direct visit.
- Outgoing wires: `/admin/dashboard`.
- Conditions: requires session; founder-only or redirect to `/unauthorized`.

Node: Admin Sections
- `/admin/dashboard`, `/admin/orgs`, `/admin/orgs/[orgId]`, `/admin/users`, `/admin/audit`, `/admin/security`, `/admin/system`, `/admin/trials`, `/admin/features`, `/admin/billing`, `/admin/revenue`, `/admin/support`, `/admin/health`, `/admin/settings`
- Incoming wires: admin shell nav.
- Outgoing wires: admin shell nav; org detail back links.
- Conditions: founder-only in middleware.

## Cross-Domain Wires (Site <-> App)

- App paths (`/app`, `/admin`, `/auth`, `/onboarding`, `/accept-invite`, `/submit`, `/signin`) redirect to `NEXT_PUBLIC_APP_URL` when accessed on site domain.
- Marketing paths (non-app routes) redirect to `NEXT_PUBLIC_SITE_URL` when accessed on app domain.
- OAuth redirect from `/` with `?code=` routed to `/auth/callback` and forced onto app domain when configured.
