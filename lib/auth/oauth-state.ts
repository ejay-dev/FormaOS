export const OAUTH_STATE_COOKIE_NAME = 'formaos_oauth_state';
// v4-031: OWASP guidance is ≤5 min for CSRF state tokens.
export const OAUTH_STATE_TTL_SECONDS = 60 * 5;

// Audit 2026-05-26 — the legacy helpers `buildGoogleOAuthRedirect`,
// `persistOAuthStateCookie`, and `clearOAuthStateCookie` were removed
// here. They generated and stored the OAuth state from the browser via
// `document.cookie`, which means the cookie could not be HttpOnly —
// an XSS payload could read the state and replay it. The replacement
// path generates state server-side at /api/auth/oauth/init and sets
// it via HttpOnly + SameSite=Lax + Secure (when HTTPS). Keeping the
// dead helpers around left an obvious footgun for any future client
// commit that re-imported them.
