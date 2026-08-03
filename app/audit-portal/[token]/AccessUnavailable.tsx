/**
 * Shown when a portal token fails validation. The copy deliberately covers
 * expired, revoked and never-issued links with one message so the page never
 * confirms whether a token existed.
 */
export function AccessUnavailable() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6">
      <h1 className="text-lg font-semibold">
        This audit access link has expired or is no longer valid
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Audit portal links are time-limited, and the organisation that issued
        yours can withdraw access at any time. Ask your contact at that
        organisation to send you a new link. FormaOS cannot issue access on
        their behalf.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        If you have only just received the link, check that the whole address
        was copied. Long links sometimes break across lines in email.
      </p>
    </div>
  );
}
