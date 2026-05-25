// Evidence upload MIME allow-list + magic-byte sniffer.
//
// The /api/v1/evidence/upload route previously stored `file.type`
// (client-controlled) directly on the storage object. An attacker
// could upload text/html or image/svg+xml and trigger stored XSS
// when the file was later previewed via a signed URL. This helper:
//
//   1. Allow-lists a small set of MIME types appropriate for
//      compliance evidence (PDFs, common images, OOXML docs, txt/csv).
//   2. Verifies the declared type against the file's magic bytes,
//      so a `.html` payload renamed and labelled `application/pdf`
//      is rejected.
//   3. Returns a canonical content-type string for storage, so
//      downstream serving code never has to trust the client.

export const ALLOWED_EVIDENCE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'text/csv',
] as const;

export type AllowedEvidenceMimeType = (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number];

const OOXML_TYPES: ReadonlySet<string> = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export type ValidateResult =
  | { ok: true; contentType: AllowedEvidenceMimeType }
  | { ok: false; reason: string };

function startsWith(buf: Buffer, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

function isLikelyTextBuffer(buf: Buffer): boolean {
  // Reject if any NULL bytes appear in the first 4 KB — binary content.
  // Allow CR/LF/TAB and any byte >= 0x20.
  const slice = buf.subarray(0, Math.min(buf.length, 4096));
  for (const byte of slice) {
    if (byte === 0) return false;
    if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) {
      return false;
    }
  }
  return true;
}

/**
 * Verify that a declared MIME type is allowed AND matches the file's
 * actual byte signature. Returns the canonical type to store, or a
 * reason for rejection.
 *
 * @param declared - the client-provided `file.type` (may be empty)
 * @param buffer   - the file's raw bytes (must be at least the first
 *                   ~16 bytes; pass the full buffer for safety)
 */
export function validateUploadedFile(
  declared: string,
  buffer: Buffer,
): ValidateResult {
  const normalized = (declared || '').toLowerCase().split(';')[0].trim();

  if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(normalized as AllowedEvidenceMimeType)) {
    return {
      ok: false,
      reason: `File type "${declared || 'unknown'}" is not allowed. Accepted: PDF, PNG, JPEG, WebP, DOCX, XLSX, PPTX, plain text, CSV.`,
    };
  }

  const declaredAllowed = normalized as AllowedEvidenceMimeType;

  // --- Magic-byte verification -------------------------------------
  // PDF: %PDF
  if (declaredAllowed === 'application/pdf') {
    if (!startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) {
      return { ok: false, reason: 'File does not match PDF signature.' };
    }
    return { ok: true, contentType: declaredAllowed };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (declaredAllowed === 'image/png') {
    if (
      !startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    ) {
      return { ok: false, reason: 'File does not match PNG signature.' };
    }
    return { ok: true, contentType: declaredAllowed };
  }

  // JPEG: FF D8 FF
  if (declaredAllowed === 'image/jpeg') {
    if (!startsWith(buffer, [0xff, 0xd8, 0xff])) {
      return { ok: false, reason: 'File does not match JPEG signature.' };
    }
    return { ok: true, contentType: declaredAllowed };
  }

  // WebP: RIFF ?? ?? ?? ?? WEBP
  if (declaredAllowed === 'image/webp') {
    if (
      !startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) ||
      !startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
    ) {
      return { ok: false, reason: 'File does not match WebP signature.' };
    }
    return { ok: true, contentType: declaredAllowed };
  }

  // OOXML (.docx/.xlsx/.pptx): all are ZIP containers starting with PK\x03\x04.
  if (OOXML_TYPES.has(declaredAllowed)) {
    if (!startsWith(buffer, [0x50, 0x4b, 0x03, 0x04])) {
      return {
        ok: false,
        reason: 'File does not match Office Open XML (ZIP) signature.',
      };
    }
    return { ok: true, contentType: declaredAllowed };
  }

  // Plain text / CSV: no reliable magic. Reject anything with NULL or
  // control bytes — that catches HTML payloads with binary preamble,
  // mislabelled binaries, etc.
  if (declaredAllowed === 'text/plain' || declaredAllowed === 'text/csv') {
    if (!isLikelyTextBuffer(buffer)) {
      return {
        ok: false,
        reason: 'Declared text file contains non-text bytes.',
      };
    }
    return { ok: true, contentType: declaredAllowed };
  }

  // Should be unreachable due to the allow-list check above.
  return { ok: false, reason: 'Unsupported file type.' };
}
