/**
 * Certificate renewals
 *
 * A filtered view of org_staff_credentials — the one register for staff
 * qualifications and checks, which lives at /app/staff-compliance. This page
 * only answers "what lapses next", so it carries no add flow and no second
 * copy of the register's columns. The 90-day horizon matches the expiring
 * count the dashboard links here with.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle, CheckCircle, Clock, User, Calendar } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";
import {
  StatusBadge,
  certificateExpiry,
} from "@/components/compliance/StatusBadge";

export const metadata = {
  title: "Certificate renewals | FormaOS",
};

const RENEWAL_HORIZON_DAYS = 90;

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
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
  const admin = createSupabaseAdminClient();

  const horizon = new Date(
    Date.now() + RENEWAL_HORIZON_DAYS * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);

  const { data: certificates, error } = await supabase
    .from("org_staff_credentials")
    .select(`
      id,
      credential_type,
      credential_name,
      issuing_authority,
      expiry_date,
      user_id
    `)
    .eq("organization_id", organization.id)
    .not("expiry_date", "is", null)
    .lte("expiry_date", horizon)
    .order("expiry_date", { ascending: true })
    .limit(200);

  // A failed read and an empty result are indistinguishable downstream — both
  // leave `certificates` null. On a renewals screen the empty state asserts
  // that nothing lapses, so the two must not share a rendering path.
  const loadFailed = Boolean(error);
  if (error) {
    console.error("[CertificatesPage] Error fetching certificates:", error);
  }

  const staffUserIds = Array.from(
    new Set((certificates ?? []).map((cert) => cert.user_id).filter(Boolean)),
  ) as string[];
  const { data: staffUsers } = staffUserIds.length
    ? await admin
        .from("user_profiles")
        .select("user_id, email, full_name")
        .in("user_id", staffUserIds)
    : { data: [] };
  const staffByUserId = new Map(
    (staffUsers ?? []).map((staff) => [
      staff.user_id as string,
      ((staff.full_name as string | null) || (staff.email as string | null) || "").trim(),
    ]),
  );

  type Certificate = NonNullable<typeof certificates>[number];
  const renewals = (certificates ?? []) as Certificate[];
  const stats = {
    expired: renewals.filter((c: Certificate) => (daysUntil(c.expiry_date) ?? 1) < 0)
      .length,
    within30: renewals.filter((c: Certificate) => {
      const days = daysUntil(c.expiry_date);
      return days !== null && days >= 0 && days <= 30;
    }).length,
    later: renewals.filter((c: Certificate) => {
      const days = daysUntil(c.expiry_date);
      return days !== null && days > 30;
    }).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="certificates-title">Certificate renewals</h1>
          <p className="page-description">
            Staff credentials that have expired or lapse within the next{" "}
            {RENEWAL_HORIZON_DAYS} days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/staff-compliance"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Full register
          </Link>
          <Link
            href="/app/staff-compliance/new"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            data-testid="add-certificate-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Link>
        </div>
      </div>

      <div className="page-content space-y-4">
      {loadFailed && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-testid="certificates-error"
        >
          Renewals could not be loaded. Nothing below reflects which
          credentials lapse — refresh the page, and use the full register if it
          keeps failing.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`metric-card ${loadFailed ? 'metric-card-neutral' : stats.expired > 0 ? 'metric-card-danger' : 'metric-card-success'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Expired</p>
          </div>
          <p className="text-2xl font-bold">{loadFailed ? "-" : stats.expired}</p>
        </div>
        <div className={`metric-card ${loadFailed ? 'metric-card-neutral' : stats.within30 > 0 ? 'metric-card-warning' : 'metric-card-success'}`}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Next 30 days</p>
          </div>
          <p className="text-2xl font-bold">{loadFailed ? "-" : stats.within30}</p>
        </div>
        <div className="metric-card metric-card-neutral">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              31 to {RENEWAL_HORIZON_DAYS} days
            </p>
          </div>
          <p className="text-2xl font-bold">{loadFailed ? "-" : stats.later}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full" data-testid="certificates-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Staff Member</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Certificate</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">Issuing Authority</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Expiry</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {renewals.map((cert: Certificate) => {
              const days = daysUntil(cert.expiry_date);
              const urgent = days !== null && days <= 30;
              return (
                <tr
                  key={cert.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    urgent ? "bg-destructive/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {staffByUserId.get(cert.user_id as string) || "-"}
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(cert.expiry_date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge {...certificateExpiry(cert.expiry_date)} />
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
            {renewals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <p>
                    {loadFailed
                      ? "Renewals could not be loaded, so nothing can be shown here."
                      : `Nothing lapses in the next ${RENEWAL_HORIZON_DAYS} days.`}
                  </p>
                  <Link href="/app/staff-compliance" className="text-primary hover:underline mt-2 inline-block">
                    Open the staff credential register
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
