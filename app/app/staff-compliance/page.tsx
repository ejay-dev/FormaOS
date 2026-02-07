/**
 * Staff Compliance / Credentials Page
 * Track staff qualifications, checks, and expiry dates
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;
  const label = getCredentialLabel(organization.industry);

  // Fetch staff credentials
  const { data: credentials, error } = await supabase
    .from("org_staff_credentials")
    .select(`
      id,
      credential_type,
      credential_name,
      credential_number,
      issuing_authority,
      issue_date,
      expiry_date,
      status,
      verified_at,
      created_at,
      staff:user_id (
        id,
        email
      )
    `)
    .eq("organization_id", organization.id)
    .order("expiry_date", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[StaffCompliancePage] Error fetching credentials:", error);
  }

  // Calculate stats
  type Credential = NonNullable<typeof credentials>[number];
  const now = new Date();
  const stats = {
    total: credentials?.length ?? 0,
    verified: credentials?.filter((c: Credential) => c.status === "verified").length ?? 0,
    expiringSoon: credentials?.filter((c: Credential) => {
      if (!c.expiry_date) return false;
      const expiry = new Date(c.expiry_date);
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    }).length ?? 0,
    expired: credentials?.filter((c: Credential) => {
      if (!c.expiry_date) return false;
      return new Date(c.expiry_date) < now;
    }).length ?? 0,
  };

  // Group by staff member
  const staffMap = new Map<string, typeof credentials>();
  credentials?.forEach((cred: Credential) => {
    const staffEmail = (cred.staff as any)?.email || "unknown";
    if (!staffMap.has(staffEmail)) {
      staffMap.set(staffEmail, []);
    }
    staffMap.get(staffEmail)!.push(cred);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="staff-compliance-title">
            {label}
          </h1>
          <p className="text-muted-foreground">
            Track staff qualifications, checks, and expiry dates
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            href="/app/staff-compliance/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            data-testid="add-credential-btn"
          >
            <Plus className="h-4 w-4" />
            Add Credential
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.verified}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert for expiring/expired */}
      {(stats.expiringSoon > 0 || stats.expired > 0) && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-600">Action Required</p>
              <p className="text-sm text-orange-600/80">
                {stats.expired > 0 && `${stats.expired} credential(s) have expired. `}
                {stats.expiringSoon > 0 && `${stats.expiringSoon} credential(s) expiring within 30 days.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
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
            {credentials?.map((credential: Credential) => {
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
                        {(credential.staff as any)?.email?.split("@")[0] || "-"}
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
            {(!credentials || credentials.length === 0) && (
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
  );
}
