/**
 * Name and lifetime of the one-time auditor-token cookie.
 *
 * Lives in its own module because both the server action that sets it and the
 * page that reads it need the value, and a 'use server' file may only export
 * async functions — exporting a const from one makes Next drop every export in
 * the module ("The module has no exports at all") at bundle time, which tsc
 * does not catch.
 */
export const ISSUED_TOKEN_COOKIE = 'formaos_auditor_issued_token';

/** Ten minutes: long enough to copy the link, short enough to expire fast. */
export const ISSUED_TOKEN_TTL_SECONDS = 600;
