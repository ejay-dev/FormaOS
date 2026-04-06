/**
 * Staff Compliance / Credentials Page
 * Track staff qualifications, checks, and expiry dates
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Shield, AlertTriangle, CheckCircle, Clock, User, Calendar, Download } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getExpiryStatus(expiryDate: string | null): { label: string; color: string; urgent: boolean } {
  if (!expiryDate) return { label: "No Expiry", color: "text-muted-foreground", urgent: false };

  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { label: "Expired", color: "text-red-600 bg-red-500/10", urgent: true };
  } else if (daysUntil <= 30) {
    return { label: `${daysUntil}d`, color: "text-orange-600 bg-orange-500/10", urgent: true };
  } else if (daysUntil <= 90) {
    return { label: `${daysUntil}d`, color: "text-amber-600 bg-amber-500/10", urgent: false };
  }
  return { label: "Valid", color: "text-green-600 bg-green-500/10", urgent: false };
}

function getCredentialLabel(industry: string | null): string {
  switch (industry) {
    case "healthcare":
      return "Staff Credentials";
    default:
      return "Staff Compliance";
  }
}

const CREDENTIAL_TYPES = {
  wwcc: "Working With Children Check",
  police_check: "Police Check",
  ndis_screening: "NDIS Worker Screening",
  first_aid: "First Aid Certificate",
  cpr: "CPR Certificate",
  manual_handling: "Manual Handling",
  medication_cert: "Medication Certificate",
  drivers_license: "Driver's License",
  vaccination: "Vaccination Record",
  other: "Other",
};

export default async function StaffCompliancePage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;
  const label = getCredentialLabel(organization.industry);
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // Fetch staff credentials
  const { data: credentials, error } = await supabase
    .from("org_staff_credentials")
    .select(`
      id,
      user_id,
      credential_type,
      credential_name,
      credential_number,
      issuing_authority,
      issue_date,
      expiry_date,
      status,
      verified_at,
      created_at
    `)
    .eq("organization_id", organization.id)
    .order("expiry_date", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[StaffCompliancePage] Error fetching credentials:", error);
  }

  // Calculate stats
  type CredentialRow = NonNullable<typeof credentials>[number];
  type Credential = CredentialRow & {
    staff: { displayName?: string | null } | null;
  };

  const credentialRows = (credentials ?? []) as CredentialRow[];
  const staffIds = Array.from(
    new Set(
      credentialRows
        .map((credential) => credential.user_id as string | null | undefined)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const { data: staffProfiles } = staffIds.length
    ? await admin
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', staffIds)
    : { data: [] as { user_id?: string | null; full_name?: string | null }[] };
  const staffDisplayNameById = new Map(
    ((staffProfiles as
      | { user_id?: string | null; full_name?: string | null }[]
      | null) ?? []
    ).map((profile) => [
      profile.user_id ?? '',
      profile.full_name?.trim() || null,
    ]),
  );
  const enrichedCredentials: Credential[] = credentialRows.map((credential) => ({
    ...credential,
    staff: credential.user_id
      ? {
          displayName:
            staffDisplayNameById.get(credential.user_id as string) ?? null,
        }
      : null,
  }));
  const now = new Date();
  const stats = {
    total: enrichedCredentials.length,
    verified: enrichedCredentials.filter((c: Credential) => c.status === "verified").length,
    expiringSoon: enrichedCredentials.filter((c: Credential) => {
      if (!c.expiry_date) return false;
      const expiry = new Date(c.expiry_date);
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    }).length,
    expired: enrichedCredentials.filter((c: Credential) => {
      if (!c.expiry_date) return false;
      return new Date(c.expiry_date) < now;
    }).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="staff-compliance-title">
            {label}
          </h1>
          <p className="page-description">
            Track staff qualifications, checks, and expiry dates
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/api/staff-credentials/export"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-sm hover:bg-accent/30 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Link>
          <Link
            href="/app/staff-compliance/new"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            data-testid="add-credential-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Link>
        </div>
      </div>

      <div className="page-content space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="metric-card metric-card-neutral">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="metric-card metric-card-success">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verified</p>
          </div>
          <p className="text-2xl font-bold">{stats.verified}</p>
        </div>
        <div className={`metric-card ${stats.expiringSoon > 0 ? 'metric-card-warning' : 'metric-card-success'}`}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expiring</p>
          </div>
          <p className="text-2xl font-bold">{stats.expiringSoon}</p>
        </div>
        <div className={`metric-card ${stats.expired > 0 ? 'metric-card-danger' : 'metric-card-success'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expired</p>
          </div>
          <p className="text-2xl font-bold">{stats.expired}</p>
        </div>
      </div>

      {/* Alert for expiring/expired */}
      {(stats.expiringSoon > 0 || stats.expired > 0) && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {stats.expired > 0 && `${stats.expired} expired. `}
            {stats.expiringSoon > 0 && `${stats.expiringSoon} expiring soon.`}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full" data-testid="staff-credentials-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Staff Member</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Credential</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">Number</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Issued</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Expiry</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrichedCredentials.map((credential: Credential) => {
              const expiryStatus = getExpiryStatus(credential.expiry_date);
              return (
                <tr
                  key={credential.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    expiryStatus.urgent ? "bg-red-500/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {(credential.staff as { displayName?: string } | null)?.displayName || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {CREDENTIAL_TYPES[credential.credential_type as keyof typeof CREDENTIAL_TYPES] ||
                        credential.credential_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm font-mono text-muted-foreground">
                      {credential.credential_number || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm">{formatDate(credential.issue_date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(credential.expiry_date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}
                    >
                      {expiryStatus.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/staff-compliance/${credential.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {enrichedCredentials.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No credentials tracked yet</p>
                  <Link
                    href="/app/staff-compliance/new"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Add your first credential
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
