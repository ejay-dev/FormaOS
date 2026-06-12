'use client';

import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export function CredentialStatusWidget({
  credentials,
}: {
  credentials: { id: string; verification_status: string }[];
}) {
  const stats = {
    verified: credentials.filter((c) => c.verification_status === 'verified')
      .length,
    pending: credentials.filter((c) => c.verification_status === 'pending')
      .length,
    rejected: credentials.filter((c) => c.verification_status === 'rejected')
      .length,
  };

  return (
    <div className="bg-surface-2 border border-border rounded-[2.5rem] p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
          Credential Integrity
        </h3>
        <span className="text-xs font-black text-foreground uppercase tracking-widest bg-surface-2 px-3 py-1 rounded-full">
          {credentials.length} Total Files
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-success/10 rounded-2xl p-4 border border-success/20 text-center">
          <ShieldCheck className="h-5 w-5 text-success mx-auto mb-2" />
          <p className="text-xl font-black text-success leading-none">
            {stats.verified}
          </p>
          <p className="text-[8px] font-black uppercase text-success tracking-tighter mt-1">
            Verified
          </p>
        </div>
        <div className="bg-warning/10 rounded-2xl p-4 border border-warning/20 text-center">
          <Clock className="h-5 w-5 text-warning mx-auto mb-2" />
          <p className="text-xl font-black text-warning leading-none">
            {stats.pending}
          </p>
          <p className="text-[8px] font-black uppercase text-warning tracking-tighter mt-1">
            Pending
          </p>
        </div>
        <div className="bg-destructive/10 rounded-2xl p-4 border border-destructive/20 text-center">
          <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
          <p className="text-xl font-black text-destructive leading-none">
            {stats.rejected}
          </p>
          <p className="text-[8px] font-black uppercase text-destructive tracking-tighter mt-1">
            Rejected
          </p>
        </div>
      </div>

      {stats.rejected > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-bold uppercase tracking-widest">
            Action Required: One or more documents were rejected by your
            employer. Please re-upload verified proof.
          </p>
        </div>
      )}
    </div>
  );
}
