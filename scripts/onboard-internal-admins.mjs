#!/usr/bin/env node
/**
 * One-shot internal admin onboarding.
 *
 * Provisions two named users into your org as admin role, generates magic-link
 * invites via Supabase Auth, and emails them via Resend with the polished
 * invite-email template. Idempotent — safe to re-run.
 *
 * Usage:
 *   node scripts/onboard-internal-admins.mjs
 *
 * Reads from .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - RESEND_API_KEY
 *   - RESEND_FROM_EMAIL
 *   - FOUNDER_EMAILS (the first one is treated as your owner email; the org
 *                    they own is the target org)
 */

// Tiny inline .env.local loader — no dotenv dependency.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
try {
  const txt = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
} catch {
  // .env.local not present — rely on real env
}

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ── Targets ─────────────────────────────────────────────────────────────
const DEFAULT_RECIPIENTS = [
  { email: 'hussainf.98@gmail.com',  name: 'Farhad',  title: 'Acting CTO' },
  { email: 'ish7iaq@gmail.com',      name: 'Ishtiaq', title: 'COO / CFO' },
];
const ROLE = 'admin'; // owner-only access excluded by PR #47 route gates

// ── CLI args ────────────────────────────────────────────────────────────
// --test <email>   send to a single throwaway alias for self-test
// --dry-run        print the action link instead of sending the email
// --apologize      include the "earlier link routed incorrectly" apology copy
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apologize = args.includes('--apologize');
const testIdx = args.indexOf('--test');
const testEmail =
  testIdx >= 0 && args[testIdx + 1] ? args[testIdx + 1].trim().toLowerCase() : null;

const RECIPIENTS = testEmail
  ? [{ email: testEmail, name: 'Self-test', title: 'Owner self-test' }]
  : DEFAULT_RECIPIENTS;

const APOLOGY_COPY = (firstName) =>
  `${firstName}, you may remember an invite from me yesterday that opened the marketing site instead of the FormaOS application. That was a routing error on my end and the cause has been fixed. The link below is the corrected version — it lands you straight inside the app. Sorry for the friction.`;

// Link lifetime in the email copy. This MUST match the project-level
// "OTP Expiration" setting in Supabase Auth (Authentication → Providers →
// Email → OTP Expiration, in seconds). The SDK has no per-link override —
// changing this constant only changes what the email *says*; the underlying
// expiry is whatever Supabase is configured to mint.
const LINK_EXPIRY_MINUTES = Number(process.env.LINK_EXPIRY_MINUTES || 60);
const expiryCopy =
  LINK_EXPIRY_MINUTES >= 60 && LINK_EXPIRY_MINUTES % 60 === 0
    ? `${LINK_EXPIRY_MINUTES / 60} hour${LINK_EXPIRY_MINUTES === 60 ? '' : 's'}`
    : `${LINK_EXPIRY_MINUTES} minutes`;

// ── Setup ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@formaos.com.au';
const FOUNDER = (process.env.FOUNDER_EMAILS ?? '').split(',')[0]?.trim();

// Resolve the *production* app base. NEXT_PUBLIC_APP_URL in .env.local typically
// points at http://localhost:3000 for dev; sending that to Supabase's verify
// endpoint as redirect_to causes a silent fall-back to Site URL (the marketing
// site) because localhost is not in the Supabase Auth Redirect URLs allowlist.
// ONBOARD_APP_URL lets you override; otherwise we ignore localhost values and
// default to the canonical production host.
const APP_BASE = (() => {
  const raw =
    (process.env.ONBOARD_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
  const isLocal = !raw || /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(raw);
  const chosen = isLocal ? 'https://app.formaos.com.au' : raw;
  try {
    return new URL(chosen).origin.replace(/\/$/, '');
  } catch {
    return 'https://app.formaos.com.au';
  }
})();

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!RESEND_KEY) {
  console.error('Missing RESEND_API_KEY in .env.local');
  process.exit(1);
}
if (!FOUNDER) {
  console.error('Missing FOUNDER_EMAILS in .env.local — needed to identify your org');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});
const resend = new Resend(RESEND_KEY);

// ── Action-link builder (port of lib/auth/hosted-auth-link.ts) ──────────
// Wraps Supabase's hosted /auth/v1/verify URL with our own /auth/confirm
// route so the session is established on the *app* domain (cookies set on
// app.formaos.com.au), and the user is then handed off to /auth/callback
// for workspace bootstrap. Without this, magic links land on Supabase's
// verify endpoint and either fall back to Site URL (the marketing site)
// or drop the user at /app with no session.
const EMAIL_OTP_TYPES = new Set([
  'signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email',
]);
function coerceEmailOtpType(v) {
  if (!v) return null;
  const n = String(v).trim().toLowerCase();
  return EMAIL_OTP_TYPES.has(n) ? n : null;
}
function parseSupabaseActionLink(raw) {
  if (!raw) return null;
  let parsed;
  try { parsed = new URL(raw); } catch { return null; }
  return {
    tokenHash:
      parsed.searchParams.get('token_hash') ||
      parsed.searchParams.get('token') ||
      null,
    type: coerceEmailOtpType(parsed.searchParams.get('type')),
    redirectTo: parsed.searchParams.get('redirect_to') || null,
  };
}
function buildHostedAuthConfirmLink({ appBase, properties, fallbackType, fallbackRedirectTo }) {
  const parsed = parseSupabaseActionLink(properties?.action_link);
  const tokenHash = properties?.hashed_token?.trim() || parsed?.tokenHash || null;
  const type =
    coerceEmailOtpType(properties?.verification_type) ||
    parsed?.type ||
    fallbackType ||
    null;
  const redirectTo =
    properties?.redirect_to?.trim() ||
    parsed?.redirectTo ||
    fallbackRedirectTo ||
    null;

  if (tokenHash && type) {
    const url = new URL('/auth/confirm', appBase);
    url.searchParams.set('token_hash', tokenHash);
    url.searchParams.set('type', type);
    if (redirectTo) url.searchParams.set('redirect_to', redirectTo);
    return url.toString();
  }
  if (properties?.action_link) {
    const url = new URL('/auth/confirm', appBase);
    url.searchParams.set('confirmation_url', properties.action_link);
    if (fallbackType) url.searchParams.set('type', fallbackType);
    if (fallbackRedirectTo) url.searchParams.set('redirect_to', fallbackRedirectTo);
    return url.toString();
  }
  return null;
}

// ── Helpers ─────────────────────────────────────────────────────────────
async function findUserByEmail(email) {
  const target = email.toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth.admin.listUsers (page ${page}) failed: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < perPage) return undefined;
  }
  return undefined;
}

async function findFounderOrgId() {
  // 1. Find founder's auth user
  const founderUser = await findUserByEmail(FOUNDER);
  if (!founderUser) {
    throw new Error(`Founder ${FOUNDER} not found in auth.users — sign in once first.`);
  }

  // 2. Find their oldest org_members row (founder may belong to multiple orgs)
  const { data: rows, error: memErr } = await admin
    .from('org_members')
    .select('organization_id, created_at')
    .eq('user_id', founderUser.id)
    .order('created_at', { ascending: true })
    .limit(1);
  if (memErr) throw new Error(`org_members lookup failed: ${memErr.message}`);
  const orgId = rows?.[0]?.organization_id;
  if (!orgId) {
    throw new Error(`Founder has no org_members row. Sign in to /app first to bootstrap.`);
  }
  return orgId;
}

async function provisionUser(orgId, recipient) {
  console.log(`\n── ${recipient.name} <${recipient.email}>`);

  // 1. Create or find the auth user (idempotent)
  let user;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: recipient.email,
    email_confirm: true,
    user_metadata: { full_name: recipient.name, title: recipient.title },
  });
  if (createErr && /already been registered|already exists/i.test(createErr.message)) {
    // Fetch the existing user (paginated — listUsers caps at 200/page)
    user = await findUserByEmail(recipient.email);
    console.log(`   auth.users: existing (${user?.id?.slice(0, 8)}…)`);
  } else if (createErr) {
    throw new Error(`createUser failed: ${createErr.message}`);
  } else {
    user = created.user;
    console.log(`   auth.users: created (${user.id.slice(0, 8)}…)`);
  }
  if (!user) throw new Error('Could not obtain user record');

  // 2. Insert or update org_members row (manual upsert — live DB may lack the
  //    unique(organization_id,user_id) constraint that the base schema declares,
  //    so we can't rely on Postgres ON CONFLICT here).
  const { data: existingMember, error: memSelErr } = await admin
    .from('org_members')
    .select('id, role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .limit(1);
  if (memSelErr) throw new Error(`org_members lookup failed: ${memSelErr.message}`);

  if (existingMember && existingMember.length > 0) {
    const { error: updErr } = await admin
      .from('org_members')
      .update({
        role: ROLE,
        department: recipient.title,
        compliance_status: 'active',
      })
      .eq('id', existingMember[0].id);
    if (updErr) throw new Error(`org_members update failed: ${updErr.message}`);
    console.log(`   org_members: updated role=${ROLE} (org=${orgId.slice(0, 8)}…)`);
  } else {
    const { error: insErr } = await admin.from('org_members').insert({
      organization_id: orgId,
      user_id: user.id,
      role: ROLE,
      department: recipient.title,
      compliance_status: 'active',
    });
    if (insErr) throw new Error(`org_members insert failed: ${insErr.message}`);
    console.log(`   org_members: inserted role=${ROLE} (org=${orgId.slice(0, 8)}…)`);
  }

  // 3. Generate a Supabase magic link, then wrap it so the click lands on
  //    OUR /auth/confirm route (cookies on app.formaos.com.au) → /auth/callback
  //    (workspace bootstrap + final hop to /app). Sending the raw Supabase
  //    hosted /auth/v1/verify URL is what caused the previous round to bounce
  //    users to the marketing site.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: recipient.email,
    options: {
      redirectTo: `${APP_BASE}/auth/callback`,
    },
  });
  if (linkErr) throw new Error(`generateLink failed: ${linkErr.message}`);

  const magicLink = buildHostedAuthConfirmLink({
    appBase: APP_BASE,
    properties: linkData?.properties,
    fallbackType: 'magiclink',
    fallbackRedirectTo: `${APP_BASE}/auth/callback`,
  });
  if (!magicLink) throw new Error('Could not build a confirm link from generateLink output');
  console.log(`   magic-link: generated → ${new URL(magicLink).origin}${new URL(magicLink).pathname}?…`);

  if (dryRun) {
    console.log(`   [dry-run] would email ${recipient.email}`);
    console.log(`   [dry-run] link: ${magicLink}`);
    return { user, magicLink };
  }

  // 4. Send the polished invite via Resend
  const apology = apologize ? APOLOGY_COPY(recipient.name) : null;
  const subject = apologize
    ? `${recipient.name} — your FormaOS access (fixed link)`
    : `${recipient.name}, you've been added to FormaOS as ${recipient.title}`;
  const html = renderInviteHtml({
    name: recipient.name,
    title: recipient.title,
    magicLink,
    apology,
  });
  const text = renderInviteText({
    name: recipient.name,
    title: recipient.title,
    magicLink,
    apology,
  });
  const sendRes = await resend.emails.send({
    from: `FormaOS <${RESEND_FROM}>`,
    to: recipient.email,
    subject,
    html,
    text,
    replyTo: FOUNDER,
    headers: {
      // Help land in Primary, not Promotions/Spam
      'X-Entity-Ref-ID': `internal-onboarding-${user.id}`,
    },
  });
  if (sendRes.error) {
    throw new Error(`Resend send failed: ${sendRes.error.message ?? JSON.stringify(sendRes.error)}`);
  }
  console.log(`   email: sent (id=${sendRes.data?.id})`);
  return { user, magicLink };
}

// ── HTML / text email body ──────────────────────────────────────────────
function renderInviteHtml({ name, title, magicLink, apology }) {
  const apologyBlock = apology
    ? `
      <div style="margin:0 0 28px;padding:16px 20px;background:#111c33;border-left:3px solid #94a3b8;border-radius:6px;">
        <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#94a3b8;font-weight:600;margin-bottom:8px;">A quick note</div>
        <p style="margin:0;font-size:14px;line-height:1.65;color:#cbd5e1;">${apology}</p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your FormaOS access</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">

    <!-- Wordmark -->
    <div style="margin-bottom:36px;">
      <div style="font-size:20px;font-weight:600;color:#f8fafc;letter-spacing:-0.3px;">FormaOS</div>
      <div style="font-size:11px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;font-weight:500;">Compliance Operating System</div>
    </div>

    <!-- Body -->
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:36px 32px;">

      <h1 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#f8fafc;line-height:1.4;">Hi ${name},</h1>
${apologyBlock}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
        I've set you up inside FormaOS as <strong style="color:#f8fafc;">${title}</strong>. Your account has the same operational access I do — every framework, register, policy and audit surface — with billing controls held to the founder seat.
      </p>

      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#cbd5e1;">
        The link below signs you in directly. Once you're in, head to <strong style="color:#f8fafc;">Settings → Security</strong> to set a password — that way you can sign in any time with email + password, no link required.
      </p>

      <!-- CTA -->
      <div style="margin:32px 0;">
        <a href="${magicLink}"
           style="display:inline-block;background:#3b82f6;color:#ffffff;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;letter-spacing:0.2px;">
          Open FormaOS
        </a>
      </div>

      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        This link is valid for ${expiryCopy}. If it expires, reply to this email and I'll send a fresh one.
      </p>
    </div>

    <!-- What you can do -->
    <div style="margin-top:20px;padding:24px 28px;background:#0f172a;border:1px solid #1e293b;border-radius:12px;">
      <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#94a3b8;font-weight:600;margin-bottom:14px;">Your access includes</div>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;color:#cbd5e1;">
        <tr><td style="padding:4px 0;width:24px;color:#64748b;">·</td><td>Compliance frameworks &amp; control evaluations</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">·</td><td>Care operations, registers, and audit trails</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">·</td><td>Vault, evidence approval, and policy management</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">·</td><td>Team management and platform settings</td></tr>
      </table>
    </div>

    <!-- Signoff -->
    <div style="margin-top:28px;padding:0 4px;font-size:14px;line-height:1.65;color:#cbd5e1;">
      Welcome to the team.<br>
      <span style="color:#94a3b8;">— Ejaz</span>
    </div>

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1e293b;text-align:center;font-size:11px;color:#475569;line-height:1.6;">
      Sent by FormaOS · <a href="https://formaos.com.au" style="color:#64748b;text-decoration:none;">formaos.com.au</a><br>
      If you weren't expecting this, you can ignore the email — no action is taken until the link above is clicked.
    </div>
  </div>
</body>
</html>`;
}

function renderInviteText({ name, title, magicLink, apology }) {
  const apologyBlock = apology ? `\n${apology}\n` : '';
  return `Hi ${name},
${apologyBlock}
I've set you up inside FormaOS as ${title}. Your account has the same operational access I do — every framework, register, policy and audit surface — with billing controls held to the founder seat.

The link below signs you in directly. Once you're in, head to Settings → Security to set a password — that way you can sign in any time with email + password, no link required.

Open FormaOS:
${magicLink}

Your access includes:
  · Compliance frameworks & control evaluations
  · Care operations, registers, and audit trails
  · Vault, evidence approval, and policy management
  · Team management and platform settings

This link is valid for ${expiryCopy}. If it expires, reply to this email and I'll send a fresh one.

Welcome to the team.
— Ejaz

formaos.com.au
If you weren't expecting this, ignore the email — no action is taken until the link above is clicked.`;
}

// ── Main ────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('FormaOS internal admin onboarding');
    console.log(`  app base : ${APP_BASE}`);
    console.log(`  mode     : ${dryRun ? 'DRY-RUN (no email send)' : 'LIVE'}`);
    console.log(`  targets  : ${RECIPIENTS.map((r) => r.email).join(', ')}\n`);
    const orgId = await findFounderOrgId();
    console.log(`Target org: ${orgId}`);
    for (const r of RECIPIENTS) {
      await provisionUser(orgId, r);
    }
    console.log('\n✅ Done. Check inboxes (Primary tab; possibly Spam on first send).');
  } catch (err) {
    console.error('\n❌ Onboarding failed:', err.message);
    process.exit(1);
  }
})();
