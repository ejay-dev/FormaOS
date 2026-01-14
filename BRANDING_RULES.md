# Branding Rules (FormaOS)

This repository enforces a strict branding policy to prevent accidental or unauthorized changes.

- Product Name: FormaOS
- Domain: formaos.com.au
- Identity: Compliance Operating System
- Logos: public/brand/formaos-{mark,wordmark-dark,wordmark-light}.svg
- Favicon: public/favicon.ico

Central source of truth:

- config/brand.ts — all UI, layout, email, and SEO should read from here.

Hard lock (guard):

- On import, `config/brand.ts` validates brand invariants.
- If values differ, it throws in development/build and logs an error in production.
- To intentionally test or override, set environment variable:
  - `BRAND_OVERRIDE_ALLOW=true`

Do not:

- Hardcode brand strings (name, domain, tagline) in components.
- Swap logo paths outside of `config/brand.ts`.

When adding new UI or emails:

- Import `brand` from `@/config/brand` and use `brand.appName`, `brand.logo.*`, `brand.identity`, and `brand.seo.*`.

QA checklist after any branding-related change:

- Header/footer logos render correctly on marketing and app shells.
- Titles and OpenGraph tags reflect “FormaOS — Compliance Operating System”.
- Favicons load on all routes.
- Email subjects and headers contain “FormaOS”.
- No off-brand strings (run a quick search for unexpected names).
