import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileEditor } from '@/components/profile/profile-editor';
import {
  Calendar,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

export default async function EmployeeProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch individual profile metadata and organization name
  const { data: profile } = await supabase
    .from('org_members')
    .select('*, organizations(name, domain, registration_number)')
    .eq('user_id', user?.id)
    .maybeSingle();

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name, phone')
    .eq('user_id', user?.id)
    .maybeSingle();

  if (!profile) return null;

  const { data: credentials } = await supabase
    .from('org_credentials')
    .select('expiry_date, verification_status')
    .eq('organization_id', profile.organization_id)
    .eq('user_id', profile.user_id);

  const credentialRows = (credentials ?? []) as Array<{
    expiry_date: string | null;
    verification_status: string | null;
  }>;
  const verifiedCredentials = credentialRows.filter(
    (row) => row.verification_status === 'verified',
  ).length;
  const nextExpiry = credentialRows
    .map((row) => row.expiry_date)
    .filter((value): value is string => Boolean(value))
    .sort()
    .find((value) => new Date(value) >= new Date());

  const _statusColors = {
    active: 'bg-emerald-400/10 text-emerald-700 border-emerald-400/30',
    at_risk: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    non_compliant: 'bg-rose-500/10 text-red-700 border-rose-400/30',
  };

  const status = profile.compliance_status ?? 'active';
  const statusTone =
    status === 'active'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
      : status === 'at_risk'
        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-500 border-rose-500/30';
  const StatusIcon = status === 'active' ? ShieldCheck : AlertCircle;

  return (
    <div className="flex flex-col h-full">
      <PageHero
        eyebrow={`Administration · ${profile.organizations.name}`}
        title="Personal Profile"
        subtitle="Manage your contact details, organization identity, and credential record."
        actions={
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold capitalize ${statusTone}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {status}
          </span>
        }
      />

      <div className="page-content max-w-4xl space-y-4">
        <ProfileEditor
          userId={user?.id ?? ''}
          orgId={profile.organization_id}
          role={profile.role}
          userEmail={user?.email ?? ''}
          orgName={profile.organizations.name}
          orgDomain={profile.organizations.domain ?? null}
          orgRegistrationNumber={
            profile.organizations.registration_number ?? null
          }
          profile={userProfile ?? null}
          avatarUrl={null}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Personal Governance Card */}
          <div className="lg:col-span-8 rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="section-label">Organizational Record</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">
                    {profile.department || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium">
                    {profile.start_date
                      ? new Date(profile.start_date).toLocaleDateString(
                          undefined,
                          { dateStyle: 'long' },
                        )
                      : 'Pending'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium capitalize">
                    {profile.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credential Integrity */}
          <div className="lg:col-span-4 rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="section-label">Credentials</h3>
            <p className="text-xs text-muted-foreground">
              Professional licences and identity documents are held in the
              organisation vault.
            </p>
            <div className="pt-3 border-t border-border space-y-2">
              {credentialRows.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No documents on file yet.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium">
                      {verifiedCredentials} of {credentialRows.length} verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Next expiry</span>
                    <span className="font-medium">
                      {nextExpiry
                        ? new Date(nextExpiry).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })
                        : 'None recorded'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
