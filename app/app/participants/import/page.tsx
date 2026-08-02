import Link from 'next/link';

export const metadata = { title: 'Import Participants | FormaOS' };

export default function ParticipantImportPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="page-title">Import participants</h1>
        <p className="text-sm text-muted-foreground">
          CSV import is not ready yet. Add participants manually for now.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">What you can do now</h2>
        <p className="text-sm text-muted-foreground">
          Create each participant from the intake form. Everything you enter
          there carries into care plans, visits, and incidents, so nothing needs
          re-entering when import arrives.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/participants/new"
            className="min-h-[44px] md:min-h-0 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add participant manually
          </Link>
          <Link
            href="/app/participants"
            className="min-h-[44px] md:min-h-0 inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to participants
          </Link>
        </div>
      </div>
    </div>
  );
}
