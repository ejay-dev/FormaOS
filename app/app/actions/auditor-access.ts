'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAuditorAccess, revokeAuditorAccess } from '@/lib/auditor/portal';
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
  }).catch(() => null);

  if (!granted) {
    redirect(`${NEW_PATH}?error=grant-failed`);
  }

  revalidatePath(LIST_PATH);
  // The raw token travels back once so the list page can show the auditor's
  // link. It is hashed at rest and cannot be recovered afterwards.
  redirect(`${LIST_PATH}?granted=${encodeURIComponent(granted.token)}`);
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
    .catch(() => false);

  if (!revoked) {
    redirect(`${LIST_PATH}?error=revoke-failed`);
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?revoked=1`);
}
