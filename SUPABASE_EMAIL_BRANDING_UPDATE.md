# Supabase Auth Branding Update (FormaOS)

Apply these values in Supabase Dashboard:

## 1) Authentication -> URL Configuration

- `Site URL`: `https://app.formaos.com.au`
- `Redirect URLs`:
  - `https://app.formaos.com.au/*`
  - `http://localhost:3000/*` (optional for local dev)

## 2) Authentication -> Email Templates

### Confirm signup

- Subject: `Confirm your FormaOS account`
- HTML source: `emails/auth/signup-confirmation.html`
- Primary CTA URL in template:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
```

### Magic link

- Subject: `Your secure sign-in link for FormaOS`
- HTML source: `emails/auth/magic-link.html`
- Primary CTA URL in template:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
```

### TokenHash fallback (older GoTrue variable sets)

If `TokenHash` is unavailable, use:

```text
{{ .SiteURL }}/auth/confirm?confirmation_url={{ .ConfirmationURL | urlquery }}
```

`/auth/confirm` in this repo supports both `token_hash` and wrapped
`confirmation_url`.

## 3) Authentication -> SMTP Settings

- `From name`: `FormaOS`
- `From email`: `no-reply@formaos.com.au` (or your authenticated domain sender)
- Ensure SPF/DKIM are valid for your sending domain.
