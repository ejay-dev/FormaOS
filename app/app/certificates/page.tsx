/**
 * Certificates Page
 * Track staff certifications, training records, and compliance certificates
 * Provides a certificate-focused view of org_staff_credentials
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ShieldCheck, AlertTriangle, CheckCircle, Clock, User, Calendar, Award } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";

export const metadata = {
  title: "Certificates | FormaOS",
};

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

// Certificate types are training/qualification focused
const CERTIFICATE_TYPES: Record<string, string> = {
  first_aid: "First Aid Certificate",
  cpr: "CPR Certificate",
  manual_handling: "Manual Handling",
  medication_cert: "Medication Certificate",
  vaccination: "Vaccination Record",
  wwcc: "Working With Children Check",
  police_check: "Police Check",
  ndis_screening: "NDIS Worker Screening",
  drivers_license: "Driver's License",
  other: "Other Certificate",
};

export default async function CertificatesPage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;
  const supabase = await createSupabaseServerClient();

  // Fetch staff credentials (certificates)
  const { data: certificates, error } = await supabase
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
    console.error("[CertificatesPage] Error fetching certificates:", error);
  }

  // Calculate stats
  type Certificate = NonNullable<typeof certificates>[number];
  const now = new Date();
  const stats = {
    total: certificates?.length ?? 0,
    verified: certificates?.filter((c: Certificate) => c.status === "verified").length ?? 0,
    expiringSoon: certificates?.filter((c: Certificate) => {
      if (!c.expiry_date) return false;
      const expiry = new Date(c.expiry_date);
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    }).length ?? 0,
    expired: certificates?.filter((c: Certificate) => {
      if (!c.expiry_date) return false;
      return new Date(c.expiry_date) < now;
    }).length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" data-testid="certificates-title">
            Certificates
          </h1>
          <p className="text-sm text-muted-foreground">
            Track staff certifications, training records, and compliance certificates
          </p>
        </div>
        <Link
          href="/app/staff-compliance/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          data-testid="add-certificate-btn"
        >
          <Plus className="h-4 w-4" />
          Add Certificate
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Certificates</p>
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
                {stats.expired > 0 && `${stats.expired} certificate(s) have expired. `}
                {stats.expiringSoon > 0 && `${stats.expiringSoon} certificate(s) expiring within 30 days.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="certificates-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Staff Member</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Certificate</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">Issuing Authority</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Issued</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Expiry</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {certificates?.map((cert: Certificate) => {
              const expiryStatus = getExpiryStatus(cert.expiry_date);
              return (
                <tr
                  key={cert.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    expiryStatus.urgent ? "bg-red-500/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {(cert.staff as { email?: string } | null)?.email?.split("@")[0] || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {CERTIFICATE_TYPES[cert.credential_type as keyof typeof CERTIFICATE_TYPES] ||
                        cert.credential_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {cert.issuing_authority || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm">{formatDate(cert.issue_date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(cert.expiry_date)}</span>
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
                      href={`/app/staff-compliance/${cert.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!certificates || certificates.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No certificates tracked yet</p>
                  <Link
                    href="/app/staff-compliance/new"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Add your first certificate
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
