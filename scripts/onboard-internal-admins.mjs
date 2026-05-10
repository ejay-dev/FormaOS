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
const RECIPIENTS = [
  { email: 'hussainf.98@gmail.com',  name: 'Farhad',  title: 'Acting CTO' },
  { email: 'ish7iaq@gmail.com',      name: 'Ishtiaq', title: 'COO / CFO' },
];
const ROLE = 'admin'; // owner-only access excluded by PR #47 route gates

// ── Setup ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@formaos.com.au';
const FOUNDER = (process.env.FOUNDER_EMAILS ?? '').split(',')[0]?.trim();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';

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

// ── Helpers ─────────────────────────────────────────────────────────────
async function findFounderOrgId() {
  // 1. Find founder's auth user
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw new Error(`auth.admin.listUsers failed: ${listErr.message}`);
  const founderUser = list.users.find(
    (u) => u.email?.toLowerCase() === FOUNDER.toLowerCase(),
  );
  if (!founderUser) {
    throw new Error(`Founder ${FOUNDER} not found in auth.users — sign in once first.`);
  }

  // 2. Find their org_members row
  const { data: membership, error: memErr } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', founderUser.id)
    .maybeSingle();
  if (memErr) throw new Error(`org_members lookup failed: ${memErr.message}`);
  if (!membership?.organization_id) {
    throw new Error(`Founder has no org_members row. Sign in to /app first to bootstrap.`);
  }
  return membership.organization_id;
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
    // Fetch the existing user
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    user = list.users.find((u) => u.email?.toLowerCase() === recipient.email.toLowerCase());
    console.log(`   auth.users: existing (${user?.id?.slice(0, 8)}…)`);
  } else if (createErr) {
    throw new Error(`createUser failed: ${createErr.message}`);
  } else {
    user = created.user;
    console.log(`   auth.users: created (${user.id.slice(0, 8)}…)`);
  }
  if (!user) throw new Error('Could not obtain user record');

  // 2. Insert or update org_members row (idempotent via upsert)
  const { error: memErr } = await admin.from('org_members').upsert(
    {
      organization_id: orgId,
      user_id: user.id,
      role: ROLE,
      department: recipient.title,
      compliance_status: 'active',
    },
    { onConflict: 'organization_id,user_id' },
  );
  if (memErr) throw new Error(`org_members upsert failed: ${memErr.message}`);
  console.log(`   org_members: role=${ROLE} (org=${orgId.slice(0, 8)}…)`);

  // 3. Generate a magic link they can click to sign in + set password
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: recipient.email,
    options: {
      redirectTo: `${APP_URL.replace(/\/$/, '')}/app`,
    },
  });
  if (linkErr) throw new Error(`generateLink failed: ${linkErr.message}`);
  const magicLink = linkData?.properties?.action_link;
  if (!magicLink) throw new Error('No action_link returned from generateLink');
  console.log(`   magic-link: generated`);

  // 4. Send the polished invite via Resend
  const subject = `${recipient.name}, you've been added to FormaOS as ${recipient.title}`;
  const html = renderInviteHtml({
    name: recipient.name,
    title: recipient.title,
    magicLink,
  });
  const text = renderInviteText({
    name: recipient.name,
    title: recipient.title,
    magicLink,
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
function renderInviteHtml({ name, title, magicLink }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome to FormaOS</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:24px;font-weight:700;color:#22d3ee;letter-spacing:-0.5px;">FormaOS</div>
      <div style="font-size:12px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">Compliance Operating System</div>
    </div>

    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#f8fafc;">Hi ${name},</h1>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">
        You've been added to FormaOS as <strong style="color:#22d3ee;">${title}</strong>. Your account has the same operational access as the founder — every framework, every register, every policy and every audit surface — minus billing controls, which stay with the owner.
      </p>

      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#cbd5e1;">
        Click below to sign in. You'll set a password and enrol two-factor authentication on first login.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${magicLink}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#3b82f6);color:#0b1220;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
          Activate my account
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        This link expires in 60 minutes. If it does, just reply to this email and a new one will be sent.
      </p>
    </div>

    <div style="margin-top:24px;padding:16px;background:#0f172a;border:1px solid #1e293b;border-radius:12px;font-size:13px;color:#94a3b8;line-height:1.6;">
      <strong style="color:#cbd5e1;">What to do next:</strong>
      <ol style="margin:8px 0 0;padding-left:20px;">
        <li style="margin-bottom:6px;">Click the button above</li>
        <li style="margin-bottom:6px;">Set a strong password</li>
        <li style="margin-bottom:6px;">Scan the TOTP QR code with Google Authenticator, Authy, or 1Password</li>
        <li>You'll land on the dashboard</li>
      </ol>
    </div>

    <div style="margin-top:24px;text-align:center;font-size:11px;color:#475569;">
      Sent by FormaOS · <a href="https://formaos.com.au" style="color:#475569;">formaos.com.au</a><br>
      If you weren't expecting this, you can ignore this email — no account is created until you click.
    </div>
  </div>
</body>
</html>`;
}

function renderInviteText({ name, title, magicLink }) {
  return `Hi ${name},

You've been added to FormaOS as ${title}.

Your account has the same operational access as the founder — every framework, every register, every policy and every audit surface — minus billing controls, which stay with the owner.

Activate your account here:
${magicLink}

What to do next:
1. Click the link above
2. Set a strong password
3. Scan the TOTP QR code with Google Authenticator, Authy, or 1Password
4. You'll land on the dashboard

The link expires in 60 minutes. If it does, reply to this email and a new one will be sent.

— FormaOS
formaos.com.au

If you weren't expecting this, ignore this email. No account is created until you click.`;
}

// ── Main ────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('FormaOS internal admin onboarding\n');
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
