import { SupabaseClient } from '@supabase/supabase-js';
import { consoleShim } from '@/lib/monitoring/console-shim';

export async function ensureOrganization(
  supabase: SupabaseClient,
  userId: string
) {
  // 1️⃣ CHECK IF USER ALREADY HAS A MEMBERSHIP
  const { data: membership, error: checkError } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) {
    consoleShim.error('[ensureOrganization] Membership check failed:', checkError.message);
    return null;
  }

  if (membership?.organization_id) {
    return membership.organization_id;
  }

  // 2️⃣ GET USER DETAILS FOR EMAIL
  const { data: userData } = await supabase.auth.getUser();
  const userEmail = userData.user?.email;
  const userName = userData.user?.user_metadata?.full_name || 
                   userData.user?.user_metadata?.name || 
                   userEmail?.split('@')[0] || 
                   'User';

  // 3️⃣ CREATE NEW ORGANIZATION
  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .insert({
      name: 'My First Organization',
      created_by: userId,
    })
    .select('id, name')
    .single();

  if (organizationError || !organization?.id) {
    consoleShim.error('[ensureOrganization] Organization creation failed:', organizationError?.message);
    return null;
  }

  // 4️⃣ CREATE MEMBERSHIP LINK
  const { error: membershipError } = await supabase
    .from('org_members')
    .insert({
      organization_id: organization.id,
      user_id: userId,
      role: 'owner',
    });

  if (membershipError) {
    consoleShim.error('[ensureOrganization] Membership creation failed:', membershipError.message);

    // ⚠️ Rollback: remove orphaned organization
    await supabase
      .from('organizations')
      .delete()
      .eq('id', organization.id);

    return null;
  }

  // 5️⃣ SEND WELCOME EMAIL (async, don't block)
  if (userEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
    if (appUrl) {
      fetch(`${appUrl.replace(/\/$/, "")}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          to: userEmail,
          userName,
          organizationName: organization.name,
        }),
      }).catch(err => consoleShim.error('[ensureOrganization] Welcome email failed:', err));
    }
  }

  // 6️⃣ RETURN ORGANIZATION ID
  return organization.id;
}
