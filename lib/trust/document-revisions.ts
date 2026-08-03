/**
 * Review stamps shown on the public trust documents.
 *
 * Procurement reads these as "when was this last reviewed", so a date may
 * only move when the document's own content changes. A styling, layout, or
 * dependency pass over the page must not touch it.
 *
 * Each value is the last date the document's content genuinely changed:
 *   dpa           , contact and processing terms (2026-05-13)
 *   subprocessors , the list in lib/trust/subprocessors.ts (2026-05-14)
 *   vendorPacket  , the generated PDF in app/api/trust-packet/vendor (2026-05-25)
 */
export const TRUST_DOCUMENT_REVISIONS = {
  dpa: '13 May 2026',
  subprocessors: '14 May 2026',
  vendorPacket: '25 May 2026',
} as const;
