import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
import { verifyStaffCredential } from "@/app/app/actions/care-operations";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  FileText,
  ShieldAlert,
  User,
} from "lucide-react";

function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

type CredentialRow = {
  id: string;
  credential_type: string;
  credential_name: string;
  credential_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  staff: { id: string; email: string | null } | null;
};

export default async function StaffCredentialDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const credentialId = resolvedParams?.id ?? "";
  if (!credentialId) redirect("/app/staff-compliance");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");
  const orgId = systemState.organization.id;

  const supabase = await createSupabaseServerClient();
  const { data: credentialData } = await supabase
    .from("org_staff_credentials")
    .select(
      `
      id,
      credential_type,
      credential_name,
      credential_number,
      issuing_authority,
      issue_date,
      expiry_date,
      status,
      verified_at,
      notes,
      created_at,
      staff:user_id(id, email)
    `,
    )
    .eq("organization_id", orgId)
    .eq("id", credentialId)
    .maybeSingle();

  const credential = credentialData as CredentialRow | null;
  if (!credential) notFound();

  const verifyAction = verifyStaffCredential.bind(null, credential.id);
  const canVerify =
    credential.status !== "verified" &&
    (systemState.role === "owner" || systemState.role === "admin");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/app/staff-compliance"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to staff compliance
        </Link>
        <h1 className="text-3xl font-black tracking-tight">{credential.credential_name}</h1>
        <p className="text-sm text-muted-foreground">
          Credential record and verification controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <p className="mt-1 text-2xl font-black capitalize">{credential.status}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Staff</p>
          <p className="mt-1 text-sm font-semibold">{credential.staff?.email || "N/A"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Issue Date</p>
          <p className="mt-1 text-sm font-semibold">{formatDate(credential.issue_date)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Expiry Date</p>
          <p className="mt-1 text-sm font-semibold">{formatDate(credential.expiry_date)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-4 w-4" />
            Credential Metadata
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="capitalize">{credential.credential_type.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Credential Number</dt>
              <dd>{credential.credential_number || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Issuing Authority</dt>
              <dd>{credential.issuing_authority || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Verified At</dt>
              <dd>{formatDate(credential.verified_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(credential.created_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4" />
            Notes
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
            {credential.notes || "No additional notes were provided."}
          </p>
        </section>
      </div>

      {canVerify ? (
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-200">
            <BadgeCheck className="h-4 w-4" />
            Verification
          </h2>
          <p className="mt-2 text-sm text-emerald-100">
            Confirm this credential as verified after reviewing evidence and validity.
          </p>
          <form action={verifyAction} className="mt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <BadgeCheck className="h-4 w-4" />
              Mark Verified
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Verification locked
          </div>
          <p className="mt-1 text-xs text-amber-200">
            Only admins and owners can verify credentials, or this record is already verified.
          </p>
        </section>
      )}

      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Track expiring credentials from the staff compliance list for renewal actions.
        </div>
      </div>
    </div>
  );
}
