'use client';

import React, { useState } from 'react';

/**
 * Admin Email Preview Page
 *
 * Renders all lifecycle email templates with test data for QA.
 * Admin-only route (gated by layout auth).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';
const _BASE = APP_URL.replace(/\/$/, '');

// Shared email styles (mirrors the actual templates)
const main = {
  backgroundColor: '#0f172a',
  fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,sans-serif',
};
const container = {
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  overflow: 'hidden' as const,
};
const headerStyle = {
  padding: '24px 32px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg,#0f172a,#1e293b)',
  borderBottom: '1px solid rgba(34,211,238,0.2)',
};
const contentStyle = { padding: '32px' };

interface TemplateConfig {
  name: string;
  subject: string;
  body: React.ReactNode;
}

function EmailShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={main}>
      <div style={container}>
        <div style={headerStyle}>
          <div style={{ color: '#22d3ee', fontSize: '24px', fontWeight: 800 }}>
            FormaOS
          </div>
          <div
            style={{
              color: '#94a3b8',
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Compliance Operating System
          </div>
        </div>
        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  );
}

const templates: TemplateConfig[] = [
  {
    name: '1. Trial Welcome',
    subject: "Welcome to FormaOS — here's how to get started",
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          Welcome to FormaOS, Alex!
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          You&apos;re set up for{' '}
          <strong style={{ color: '#22d3ee' }}>Healthcare</strong> compliance.
        </p>
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 10,
            padding: '16px 20px',
            margin: '20px 0',
          }}
        >
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            <strong style={{ color: '#22d3ee' }}>1.</strong> Activate your first
            framework
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            <strong style={{ color: '#22d3ee' }}>2.</strong> Create your first
            obligation
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            <strong style={{ color: '#22d3ee' }}>3.</strong> Invite your team
          </p>
        </div>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href="https://app.formaos.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#22d3ee',
              borderRadius: 8,
              color: '#0f172a',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Go to FormaOS →
          </a>
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          14 days remaining in your trial
        </p>
      </EmailShell>
    ),
  },
  {
    name: '2. Day 3 Activation Nudge',
    subject: "You haven't activated a framework yet",
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          Your compliance journey starts with a framework
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          We have pre-built frameworks for{' '}
          <strong style={{ color: '#22d3ee' }}>Healthcare</strong> ready to go.
          Takes less than 2 minutes.
        </p>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href="https://app.formaos.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#22d3ee',
              borderRadius: 8,
              color: '#0f172a',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Activate Healthcare Framework →
          </a>
        </div>
      </EmailShell>
    ),
  },
  {
    name: '3. Day 7 Progress',
    subject: "Week 1 with FormaOS — here's your progress",
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          Great progress this week!
        </h1>
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 10,
            padding: '16px 20px',
            margin: '20px 0',
          }}
        >
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Obligations created:{' '}
            <strong style={{ color: '#22d3ee' }}>12</strong>
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Tasks completed: <strong style={{ color: '#22d3ee' }}>5</strong>
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Team members: <strong style={{ color: '#22d3ee' }}>3</strong>
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Compliance score: <strong style={{ color: '#22d3ee' }}>32%</strong>
          </p>
        </div>
      </EmailShell>
    ),
  },
  {
    name: '4. Trial Expiring (Day 11)',
    subject: 'Your FormaOS trial ends in 3 days',
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          Your trial ends in 3 days
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          You&apos;ve built{' '}
          <strong style={{ color: '#22d3ee' }}>12 obligations</strong> and
          collected{' '}
          <strong style={{ color: '#22d3ee' }}>8 evidence items</strong>.
        </p>
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 10,
            padding: '16px 20px',
            margin: '20px 0',
          }}
        >
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Starter — $159/mo
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Professional — $239/mo
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Enterprise — $399/mo
          </p>
        </div>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href="https://app.formaos.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#22d3ee',
              borderRadius: 8,
              color: '#0f172a',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Upgrade Now →
          </a>
        </div>
      </EmailShell>
    ),
  },
  {
    name: '5. Trial Final Warning (Day 13)',
    subject: "Last day of your FormaOS trial — don't lose your work",
    body: (
      <EmailShell>
        <h1 style={{ color: '#fb923c', fontSize: 22 }}>
          ⚠️ Tomorrow your trial expires
        </h1>
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 10,
            padding: '16px 20px',
            margin: '20px 0',
          }}
        >
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            12 obligations
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            8 evidence items
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            3 team members
          </p>
        </div>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href="https://app.formaos.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#fb923c',
              borderRadius: 8,
              color: '#0f172a',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Upgrade Before Midnight →
          </a>
        </div>
      </EmailShell>
    ),
  },
  {
    name: '6. Trial Expired',
    subject: 'Your FormaOS trial has ended',
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>Your trial has ended</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          Your trial has ended but{' '}
          <strong style={{ color: '#22d3ee' }}>your data is safe</strong>. We
          keep it for 30 days.
        </p>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href="https://app.formaos.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#22d3ee',
              borderRadius: 8,
              color: '#0f172a',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Reactivate FormaOS →
          </a>
        </div>
      </EmailShell>
    ),
  },
  {
    name: '7. Payment Failed',
    subject: 'Action required — FormaOS payment failed',
    body: (
      <EmailShell>
        <h1 style={{ color: '#f87171', fontSize: 22 }}>⚠️ Payment failed</h1>
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 10,
            padding: '16px 20px',
            margin: '20px 0',
          }}
        >
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Card ending in: <strong>4242</strong>
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            Amount: <strong>$239.00</strong>
          </p>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          You have <strong style={{ color: '#f1f5f9' }}>3 days</strong> before
          access is restricted.
        </p>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href="https://app.formaos.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#f87171',
              borderRadius: 8,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Update Payment Method →
          </a>
        </div>
      </EmailShell>
    ),
  },
  {
    name: '8. Payment Recovered',
    subject: 'Payment successful — FormaOS access restored',
    body: (
      <EmailShell>
        <h1 style={{ color: '#22d3ee', fontSize: 22 }}>
          ✅ Payment successful
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          Your payment was successfully processed. Full access to FormaOS has
          been restored.
        </p>
      </EmailShell>
    ),
  },
  {
    name: '9. Plan Upgraded',
    subject: 'Welcome to FormaOS Professional',
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          Welcome to FormaOS Professional! 🎉
        </h1>
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 10,
            padding: '16px 20px',
            margin: '20px 0',
          }}
        >
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            <span style={{ color: '#22d3ee' }}>✓</span> Advanced reporting
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            <span style={{ color: '#22d3ee' }}>✓</span> Governance controls
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: '4px 0' }}>
            <span style={{ color: '#22d3ee' }}>✓</span> Workflow automation
          </p>
        </div>
      </EmailShell>
    ),
  },
  {
    name: '10. Plan Downgraded',
    subject: 'Your FormaOS plan has been updated',
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          Your plan has been updated
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          Your FormaOS plan is now{' '}
          <strong style={{ color: '#22d3ee' }}>Starter</strong>. Your data is
          all still there.
        </p>
      </EmailShell>
    ),
  },
  {
    name: '11. Subscription Cancelled',
    subject: "We're sorry to see you go",
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          We&apos;re sorry to see you go
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          Your subscription has been cancelled. Your data is kept for{' '}
          <strong style={{ color: '#22d3ee' }}>30 days</strong>.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          What could we have done better? Just reply to this email.
        </p>
      </EmailShell>
    ),
  },
  {
    name: '12. Team Member Invitation',
    subject: 'Alex has invited you to FormaOS',
    body: (
      <EmailShell>
        <h1 style={{ color: '#f1f5f9', fontSize: 22 }}>
          You&apos;ve been invited!
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          <strong style={{ color: '#f1f5f9' }}>Alex Chen</strong> has invited
          you to join <strong style={{ color: '#22d3ee' }}>Acme Corp</strong> on
          FormaOS.
        </p>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <a
            href="https://app.formaos.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#22d3ee',
              borderRadius: 8,
              color: '#0f172a',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Accept Invitation →
          </a>
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          This invitation expires in 7 days.
        </p>
      </EmailShell>
    ),
  },
];

export default function AdminEmailPreviewPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = templates[selectedIdx];

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Email Template Preview
      </h1>
      <div className="flex gap-6">
        {/* Template List */}
        <div className="w-64 shrink-0 space-y-1">
          {templates.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setSelectedIdx(i)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                i === selectedIdx
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex-1">
          <div className="mb-4 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Subject:</strong> {selected.subject}
            </p>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            {selected.body}
          </div>
        </div>
      </div>
    </div>
  );
}
