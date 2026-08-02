'use client';

import { AlertCircle, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';

export function ExpiryAlertWidget({
  atRiskDocs,
}: {
  atRiskDocs: { id: string; document_type: string; expiry_date: string }[];
}) {
  if (atRiskDocs.length === 0) return null;

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-xl p-6 space-y-6 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-warning">
          <AlertCircle className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Expiring credentials</h3>
        </div>
        <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">
          {atRiskDocs.length} at risk
        </span>
      </div>

      <div className="space-y-3">
        {atRiskDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-surface-2 rounded-lg p-4 flex items-center justify-between border border-warning/20 group hover:bg-surface-3 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {doc.document_type}
                </p>
                <p className="mt-0.5 text-xs text-warning">
                  Expires {new Date(doc.expiry_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Link
              href={`/app/people`}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      <p className="pt-2 text-center text-xs text-warning">
        The people holding these credentials have been notified.
      </p>
    </div>
  );
}
