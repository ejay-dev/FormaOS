'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createAuditorAccess, revokeAuditorAccess } from '@/lib/auditor/portal';
// The raw token grants a third party read access to the org's whole evidence
// set until expiry, so it is handed back through a short-lived httpOnly cookie
// rather than the query string — keeping it out of the address bar, browser
// history, the Referer of any outbound click, and proxy/CDN access logs.
import {
  ISSUED_TOKEN_COOKIE,
  ISSUED_TOKEN_TTL_SECONDS,
} from '@/lib/auditor/issued-token';
import { fetchSystemState } from '@/lib/system-state/server';

const LIST_PATH = '/app/settings/auditor-access';
const NEW_PATH = '/app/settings/auditor-access/new';



// An auditor grant hands a third party read access to the org's evidence, so
// grant and revoke sit behind the same roles the rest of the settings cluster
// uses for workspace-wide changes.
function canManageAuditorAccess(role: string | null | undefined) {
  return role === 'owner' || role === 'admin';
}

export async function grantAuditorAccess(formData: FormData) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  if (!canManageAuditorAccess(state.role)) {
    redirect(`${NEW_PATH}?error=forbidden`);
  }

  const auditorName = String(formData.get('auditor_name') ?? '').trim();
  const auditorEmail = String(formData.get('auditor_email') ?? '').trim();
  const auditorCompany = String(formData.get('auditor_company') ?? '').trim();
  const expiresInDays = Number.parseInt(
    String(formData.get('expires_in_days') ?? '30'),
    10,
  );

  if (!auditorName || !auditorEmail) {
    redirect(`${NEW_PATH}?error=name-and-email-required`);
  }

  // Only the create call is wrapped: a redirect() inside a try/catch is
  // swallowed by the catch, which would turn every success into an error.
  const granted = await createAuditorAccess(state.organization.id, state.user.id, {
    auditorName,
    auditorEmail,
    auditorCompany: auditorCompany || undefined,
    scopes: {},
    expiresInDays: Number.isFinite(expiresInDays) ? expiresInDays : 30,
  }).catch((err: unknown) => {
    // The operator only ever sees ?error=grant-failed, so without this the
    // cause of a failed grant is lost entirely.
    console.error('[auditor-access] createAuditorAccess failed', {
      orgId: state.organization.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  });

  if (!granted) {
    redirect(`${NEW_PATH}?error=grant-failed`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ISSUED_TOKEN_COOKIE, granted.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: LIST_PATH,
    maxAge: ISSUED_TOKEN_TTL_SECONDS,
  });

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?granted=1`);
}

export async function revokeAuditorGrant(formData: FormData) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  if (!canManageAuditorAccess(state.role)) {
    redirect(`${LIST_PATH}?error=forbidden`);
  }

  const tokenId = String(formData.get('tokenId') ?? '').trim();
  if (!tokenId) {
    redirect(`${LIST_PATH}?error=revoke-failed`);
  }

  const revoked = await revokeAuditorAccess(tokenId, state.organization.id)
    .then(() => true)
    .catch((err: unknown) => {
      console.error('[auditor-access] revokeAuditorAccess failed', {
        orgId: state.organization.id,
        tokenId,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    });

  if (!revoked) {
    redirect(`${LIST_PATH}?error=revoke-failed`);
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?revoked=1`);
}

/**
 * Clears the one-time token cookie once the operator has copied the link.
 * Without this the link stays retrievable for the full cookie TTL on any
 * revisit to the list page.
 */
export async function dismissIssuedAuditorToken() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ISSUED_TOKEN_COOKIE, path: LIST_PATH });
  redirect(LIST_PATH);
}
