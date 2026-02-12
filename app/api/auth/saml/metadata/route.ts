/**
 * SAML 2.0 Service Provider (SP) Metadata Endpoint
 *
 * GET /api/auth/saml/metadata
 *
 * Returns an XML document that Identity Providers can consume to configure
 * their side of the SAML trust relationship. The metadata includes:
 *   - SP Entity ID
 *   - Assertion Consumer Service (ACS) URL
 *   - NameID format
 *
 * Configuration is driven by the `NEXT_PUBLIC_APP_URL` environment variable.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  // Strip trailing slash for consistency
  return raw.replace(/\/+$/, '');
}

/**
 * Build a minimal but valid SAML 2.0 SP metadata XML document.
 */
function buildSPMetadata(appUrl: string): string {
  const entityId = `${appUrl}/api/auth/saml/metadata`;
  const acsUrl = `${appUrl}/api/auth/saml`;

  // XML is intentionally minimal — just enough for an IdP to configure a
  // trust relationship. Additional elements (signing keys, SLO endpoints,
  // requested attributes) will be added as the implementation matures.
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<md:EntityDescriptor',
    '  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"',
    `  entityID="${escapeXml(entityId)}">`,
    '  <md:SPSSODescriptor',
    '    AuthnRequestsSigned="false"',
    '    WantAssertionsSigned="true"',
    '    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">',
    '    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>',
    '    <md:AssertionConsumerService',
    '      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"',
    `      Location="${escapeXml(acsUrl)}"`,
    '      index="0"',
    '      isDefault="true" />',
    '  </md:SPSSODescriptor>',
    '</md:EntityDescriptor>',
  ].join('\n');
}

/**
 * Minimal XML attribute escaping for values interpolated into the document.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// GET — Serve SP Metadata
// ---------------------------------------------------------------------------

export async function GET() {
  const appUrl = getAppUrl();
  const xml = buildSPMetadata(appUrl);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/samlmetadata+xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
