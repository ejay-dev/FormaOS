# Security Baseline - Phase A (Audit-Only)

This phase is intentionally non-breaking and reversible.

## Scope

- Adds an audit-only CI workflow: `.github/workflows/security-baseline.yml`
- Adds a local/CI baseline checker: `scripts/check-security-baseline.mjs`
- Adds read-only RLS audit queries under `supabase/audits/`
- Does **not** modify runtime behavior, auth flow, or database policies

## Canonical Environment Names

Use these names as source of truth:

- Supabase public URL: `NEXT_PUBLIC_SUPABASE_URL`
- Supabase public anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase service role key: `SUPABASE_SERVICE_ROLE_KEY`
- Stripe secret key: `STRIPE_SECRET_KEY`
- Stripe webhook secret: `STRIPE_WEBHOOK_SECRET`
- Stripe basic plan price: `STRIPE_PRICE_BASIC`
- Stripe pro plan price: `STRIPE_PRICE_PRO`
- Stripe enterprise plan price: `STRIPE_PRICE_ENTERPRISE` (optional)
- Resend API key: `RESEND_API_KEY`
- Upstash URL: `UPSTASH_REDIS_REST_URL`
- Upstash token: `UPSTASH_REDIS_REST_TOKEN`

Compatibility aliases currently accepted (no behavior change in Phase A):

- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE`
- `STRIPE_PRICE_STARTER`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ENTERPRISE_PRICE_ID`

## Running the Baseline Check

```bash
npm run check:security-baseline
```

Strict mode (future hard enforcement):

```bash
SECURITY_BASELINE_STRICT=1 npm run check:security-baseline
```

## Notes

- Audit-only mode reports warnings but exits successfully.
- Strict mode can be enabled later after alignment work is complete.
