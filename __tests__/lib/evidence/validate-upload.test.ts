import {
  validateUploadedFile,
  ALLOWED_EVIDENCE_MIME_TYPES,
} from '@/lib/evidence/validate-upload';

// Tiny helpers to build minimal "valid by magic" buffers for each
// type. Real files have more bytes but the validator only inspects
// the signature prefix.
const buf = (...bytes: number[]) => Buffer.from(bytes);

const PDF_BYTES = buf(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37);
const PNG_BYTES = buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00);
const JPEG_BYTES = buf(0xff, 0xd8, 0xff, 0xe0, 0x00);
const WEBP_BYTES = buf(
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x00, 0x00, 0x00, 0x00, // size (placeholder)
  0x57, 0x45, 0x42, 0x50, // WEBP
);
const OOXML_BYTES = buf(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00);
const TEXT_BYTES = Buffer.from('hello, world\nthis is text\n', 'utf-8');

describe('validateUploadedFile', () => {
  describe('allow-list', () => {
    it.each(ALLOWED_EVIDENCE_MIME_TYPES)('accepts type %s', (mime) => {
      // Pair each allowed type with a body that satisfies its magic check.
      const body = (() => {
        switch (mime) {
          case 'application/pdf':
            return PDF_BYTES;
          case 'image/png':
            return PNG_BYTES;
          case 'image/jpeg':
            return JPEG_BYTES;
          case 'image/webp':
            return WEBP_BYTES;
          case 'text/plain':
          case 'text/csv':
            return TEXT_BYTES;
          default:
            return OOXML_BYTES; // any OOXML
        }
      })();
      const result = validateUploadedFile(mime, body);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.contentType).toBe(mime);
    });

    it('rejects image/svg+xml (XSS vector)', () => {
      const svg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        'utf-8',
      );
      const result = validateUploadedFile('image/svg+xml', svg);
      expect(result.ok).toBe(false);
    });

    it('rejects text/html', () => {
      const html = Buffer.from('<html><body>hi</body></html>', 'utf-8');
      expect(validateUploadedFile('text/html', html).ok).toBe(false);
    });

    it('rejects application/octet-stream', () => {
      expect(validateUploadedFile('application/octet-stream', PDF_BYTES).ok).toBe(
        false,
      );
    });

    it('rejects empty declared type', () => {
      expect(validateUploadedFile('', PDF_BYTES).ok).toBe(false);
    });

    it('normalises charset suffix and casing', () => {
      const result = validateUploadedFile('TEXT/PLAIN; charset=utf-8', TEXT_BYTES);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.contentType).toBe('text/plain');
    });
  });

  describe('magic-byte sniff', () => {
    it('rejects PDF declaration with HTML body', () => {
      const html = Buffer.from('<html>not a pdf</html>', 'utf-8');
      const result = validateUploadedFile('application/pdf', html);
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.reason).toMatch(/PDF signature/i);
    });

    it('rejects PNG declaration with JPEG body', () => {
      const result = validateUploadedFile('image/png', JPEG_BYTES);
      expect(result.ok).toBe(false);
    });

    it('rejects WebP without WEBP marker at offset 8', () => {
      const noMarker = buf(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0, 0, 0, 0);
      expect(validateUploadedFile('image/webp', noMarker).ok).toBe(false);
    });

    it('rejects OOXML declaration with non-ZIP body', () => {
      const result = validateUploadedFile(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        PDF_BYTES,
      );
      expect(result.ok).toBe(false);
    });

    it('rejects text/plain with NULL bytes (binary masquerading as text)', () => {
      const binary = Buffer.from([0x68, 0x69, 0x00, 0x42, 0x59, 0x45]);
      expect(validateUploadedFile('text/plain', binary).ok).toBe(false);
    });

    it('rejects text/csv with non-printable control bytes', () => {
      const sneaky = Buffer.concat([
        Buffer.from('a,b,c\n', 'utf-8'),
        Buffer.from([0x07, 0x08]), // BEL + BS
      ]);
      expect(validateUploadedFile('text/csv', sneaky).ok).toBe(false);
    });
  });
});
