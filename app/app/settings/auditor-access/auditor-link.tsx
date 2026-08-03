'use client';

import { useRef, useState } from 'react';

/**
 * The auditor's link is shown once, immediately after the grant is created —
 * the token is stored hashed, so it cannot be read back later. Copy state is
 * announced rather than shown by colour alone.
 */
export function AuditorLink({ url }: { url: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const input = inputRef.current;
    input?.select();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked; the link stays selected so the
      // admin can copy it manually.
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="auditor-link">
        Auditor access link
      </label>
      <input
        ref={inputRef}
        id="auditor-link"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="button"
        onClick={() => void copy()}
        className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Copy link
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
      {copied ? (
        <span className="self-center text-sm text-muted-foreground" aria-hidden>
          Copied
        </span>
      ) : null}
    </div>
  );
}
