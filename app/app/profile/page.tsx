import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileEditor } from '@/components/profile/profile-editor';
import {
  Calendar,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  Building,
} from 'lucide-react';

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
    .select('full_name, phone, avatar_path')
    .eq('user_id', user?.id)
    .maybeSingle();

  if (!profile) return null;

  const avatarPath = userProfile?.avatar_path ?? null;
  const avatarSigned = avatarPath
    ? await supabase.storage
        .from('user-avatars')
        .createSignedUrl(avatarPath, 60 * 60 * 12)
    : { data: null };
  const avatarUrl = avatarSigned?.data?.signedUrl ?? null;

  const _statusColors = {
    active: 'bg-emerald-400/10 text-emerald-700 border-emerald-400/30',
    at_risk: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    non_compliant: 'bg-rose-500/10 text-red-700 border-rose-400/30',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Profile</h1>
          <p className="page-description flex items-center gap-1.5">
            <Building className="h-3 w-3" />
            {profile.organizations.name}
          </p>
        </div>
        <span
          className={`status-pill ${
            profile.compliance_status === 'active'
              ? 'status-pill-green'
              : profile.compliance_status === 'at_risk'
                ? 'status-pill-amber'
                : 'status-pill-red'
          }`}
        >
          {profile.compliance_status === 'active' ? (
            <ShieldCheck className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {profile.compliance_status || 'Active'}
        </span>
      </div>

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
          avatarUrl={avatarUrl}
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
                  <p className="text-xs text-muted-foreground">Access Tier</p>
                  <p className="text-sm font-medium capitalize">
                    {profile.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-mono font-medium">
                    USR-{profile.user_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credential Integrity */}
          <div className="lg:col-span-4 rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="section-label">Credential Integrity</h3>
            <p className="text-xs text-muted-foreground">
              Professional licenses and identity documents are managed by the
              organization vault.
            </p>
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Document Status</span>
                <span className="text-emerald-500 font-medium">
                  Audit Ready
                </span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
