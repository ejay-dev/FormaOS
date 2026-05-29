import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import { registerPdfFonts } from './fonts';

// FormaOS charcoal wordmark, embedded as a base64 data URI so PDF rendering
// never depends on a network fetch or deploy URL. Read once, memoized.
let _brandWordmark: string | null = null;
function brandWordmark(): string {
  if (_brandWordmark) return _brandWordmark;
  const buf = fs.readFileSync(
    path.join(process.cwd(), 'public/brand/formaos-wordmark-charcoal.png'),
  );
  _brandWordmark = `data:image/png;base64,${buf.toString('base64')}`;
  return _brandWordmark;
}

registerPdfFonts();

export const palette = {
  ink: '#0F172A',
  muted: '#475569',
  subtle: '#94A3B8',
  divider: '#E2E8F0',
  accent: '#1D4ED8',
  ok: '#15803D',
  warn: '#B45309',
  danger: '#B91C1C',
  surface: '#F8FAFC',
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 10,
    color: palette.ink,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.4,
  },
  pageHeader: {
    position: 'absolute',
    top: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
    fontSize: 8,
    color: palette.muted,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    fontSize: 8,
    color: palette.subtle,
  },
  h1: {
    fontFamily: 'Sora',
    fontWeight: 700,
    fontSize: 22,
    marginBottom: 8,
  },
  h2: {
    fontFamily: 'Sora',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 18,
    marginBottom: 6,
  },
  h3: {
    fontFamily: 'Sora',
    fontWeight: 700,
    fontSize: 11,
    marginTop: 12,
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: palette.muted,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
    marginVertical: 10,
  },
  table: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
    paddingVertical: 5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.ink,
    paddingVertical: 5,
    backgroundColor: palette.surface,
  },
  tableCell: {
    paddingHorizontal: 4,
    fontSize: 9,
  },
  tableHeaderCell: {
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: 600,
  },
  badge: {
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 600,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  kvRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  kvKey: {
    width: 140,
    color: palette.muted,
    fontSize: 9,
  },
  kvValue: {
    flex: 1,
    fontSize: 9,
  },
});

export type PageHeaderFooterProps = {
  title: string;
  orgName: string;
  classification?: string;
};

export function PageHeader({ title, orgName, classification }: PageHeaderFooterProps) {
  return (
    <View style={styles.pageHeader} fixed>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          src={brandWordmark()}
          style={{ height: 11, width: 110, marginRight: 8 }}
        />
        <Text>{orgName}</Text>
      </View>
      <Text>{title}</Text>
      {classification ? <Text>{classification}</Text> : <Text> </Text>}
    </View>
  );
}

export function PageFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>Generated {formatTimestamp(generatedAt)}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}Z`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function severityColor(
  sev: 'low' | 'medium' | 'high' | 'critical' | string,
): string {
  switch (sev) {
    case 'critical':
      return palette.danger;
    case 'high':
      return palette.warn;
    case 'medium':
      return palette.accent;
    case 'low':
    default:
      return palette.muted;
  }
}
