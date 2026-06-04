import type { Metadata } from 'next';
import { siteUrl } from '@/lib/seo';
import VerifyClient from './VerifyClient';

// Audit 2026-05-27 (Tier 2.B), public audit-export verifier page.
//
// Lets external auditors paste either:
//   1. A FormaOS audit-export bundle (Merkle root + per-entry proofs).
//   2. A Rekor entry UUID + expected top-of-chain hash.
//
// Verification happens entirely client-side via SubtleCrypto. No data
// touches the FormaOS server. Customers can share an export bundle with
// outside auditors and point them at this page to verify integrity
// without giving them a FormaOS login or running a CLI.

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Verify FormaOS audit export',
  description:
    'Independently verify a FormaOS audit-export Merkle bundle or Sigstore Rekor anchor entirely in your browser. No login required, no data leaves your machine.',
  alternates: { canonical: `${siteUrl}/verify` },
  robots: { index: true, follow: false },
};

export default function VerifyPage() {
  return <VerifyClient />;
}
